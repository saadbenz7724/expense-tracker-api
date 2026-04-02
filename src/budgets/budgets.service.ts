import { ConflictException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Budget } from "./budget.entity";
import { Repository } from "typeorm";
import { CategoriesService } from "src/categories/categories.service";
import { ExpensesService } from "src/expenses/expenses.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { QueryBudgetDto } from "./dto/query-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { count } from "console";

@Injectable()
export class BudgetsService{
    constructor(
        @InjectRepository(Budget)
        private budgetRepo: Repository<Budget>,
        private catgoriesService: CategoriesService,
        @Inject(forwardRef(()=>ExpensesService))
        private expensesService: ExpensesService,
    ){}
    
    async create(userId: number, dto: CreateBudgetDto): Promise<Budget> {
        await this.catgoriesService.findOne(dto.categoryId, userId)
        const existing = await this.budgetRepo.findOne({
            where: {
                userId,
                categoryId: dto.categoryId,
                month: dto.month,
                year: dto.year,
            },
        });
        if(existing){
            throw new ConflictException('Budget already exists for this category and month');
        }
        const budget = this.budgetRepo.create({
            ...dto,
            userId,
            alertPercentage: dto.alertPercentage || 80,
        });
        return this.budgetRepo.save(budget);
    }

    async findAll(userId: number, query: QueryBudgetDto){
        const { month, year } = query;
        const qb = this.budgetRepo.createQueryBuilder('budget').leftJoinAndSelect('budget.category', 'category')
              .where('budget.user_id = :userId', {userId});
        if(month){
            qb.andWhere('budget.month = :month', {month});
        }
        if(year){
            qb.andWhere('budget.year = :year', {year});
        }
        qb.orderBy('budget.year', 'DESC').addOrderBy('budget.year', 'DESC');
        const budgets = await qb.getMany();
        const budgetsWithUsage = await Promise.all(
            budgets.map((budget) => this.attachUsage(budget, userId)),
        );
        return budgetsWithUsage;
    }

    async findOne(id: number, userId: number){
        const budget = await this.budgetRepo.findOne({
            where: {id},
            relations: ['category'],
        });
        if(!budget){
            throw new NotFoundException(`Budget #${id} not found`)
        }
        if(budget.userId !== userId){
            throw new ForbiddenException('you do not own this budget');
        }
        return this.attachUsage(budget, userId);
    }

    async update(
        id: number,
        userId: number,
        dto: UpdateBudgetDto,
    ): Promise<any> {
        const budget = await this.budgetRepo.findOne({where: {id}});
        if(!budget){
            throw new NotFoundException(`Budget #${id} not found`);
        }
        if(budget.userId !== userId){
            throw new ForbiddenException('you do not own this budget');
        }
        if (dto.limitAmount && budget.limitAmount && dto.limitAmount > budget.limitAmount){
            budget.isAlertSent = false;
        }
        Object.assign(budget, dto);
        const updated = await this.budgetRepo.save(budget);
        return this.attachUsage(updated, userId);
    }

    async remove(id: number, userId: number): Promise<{message: string}> {
        const budget = await this.budgetRepo.findOne({
            where: {id}
        });
        if(!budget){
            throw new NotFoundException(`Budget #${id} not found`);
        }
        if(budget.userId !== userId){
            throw new ForbiddenException('you do not own this budget');
        }
        await this.budgetRepo.remove(budget);
        return { message: 'budget deleted successfully' };
    }

    async checkBudgetAlert(
        userId: number,
        categoryId: number,
        month: number,
        year: number,
    ) {
        const budget = await this.budgetRepo.findOne({
            where: { userId, categoryId, month, year },
            relations: ['category'],
        });
        if(!budget) return null;
        const spentData = await this.getSpentAmount(
            userId,
            categoryId,
            month,
            year,
        );
        const spentAmount = spentData.totalSpent;
        const percentage = (spentAmount/Number(budget.limitAmount)) * 100;
        if(percentage >= (budget.alertPercentage ?? 80) && !budget.isAlertSent){
            budget.isAlertSent = true;
            await this.budgetRepo.save(budget);
            return {
                alertTriggered: true,
                message: `Budget Alert! You have used ${percentage.toFixed(1)}% of your "${budget.category?.name}" budget`,
                budget: {
                    category: budget.category?.name,
                    limitAmount: budget.limitAmount,
                    spentAmount,
                    percentage: percentage.toFixed(1),
                },
            };
        }
        return { alertTriggered: false };
    }

    private async getSpentAmount(
        userId: number,
        categoryId: number,
        month: number,
        year: number,
    ) {
        const result = await this.budgetRepo.manager
            .createQueryBuilder()
            .select('SUM(e.amount)', 'totalSpent')
            .addSelect('COUNT(e.id)', 'count')
            .from('expenses', 'e')
            .where('e.user_id = :userId', { userId })
            .andWhere('e.category_id = :categoryId', { categoryId })
            .andWhere('e.type = :type', { type: 'expense' })
            .andWhere('e.is_deleted = false')
            .andWhere('MONTH(e.expense_date) = :month', { month })
            .andWhere('YEAR(e.expense_date) = :year', { year })
            .getRawOne();

        return {
            totalSpent: parseFloat(result?.totalSpent || '0'),
            count: parseInt(result?.count || '0'),
        };
    }

    private async attachUsage(budget: Budget, userId: number){
        const spentData = await this.getSpentAmount(
            userId,
            budget.categoryId || 0,
            budget.month || 0,
            budget.year || 0,
        );
        const spentAmount = spentData.totalSpent;
        const limitAmount = Number(budget.limitAmount);
        const percentage = limitAmount > 0 ? parseFloat(((spentAmount / limitAmount)*100).toFixed(1)):0;
        const remaining = limitAmount - spentAmount;
        let status: string;
        if(percentage>=100) {
            status = 'exceeded';
        } else if(percentage >= (budget.alertPercentage || 80)){
            status = 'warning';
        } else {
            status = 'safe';
        }
        return {
            ...budget,
            usage: {
                spentAmount,
                limitAmount,
                remaining: remaining < 0 ? 0 : remaining,
                percentage,
                status,
                transactionCount: spentData.count,
            },
        };
    }
}