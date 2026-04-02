import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Expense } from "./expense.entity";
import { Repository } from "typeorm";
import { CategoriesService } from "src/categories/categories.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { QueryExpenseDto } from "./dto/query-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { forwardRef, Inject } from '@nestjs/common';
import { BudgetsService } from '../budgets/budgets.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ExpensesService {
    constructor(
        @InjectRepository(Expense)
        private expenseRepository: Repository<Expense>,
        private categoriesService: CategoriesService,
        @Inject(forwardRef(()=>BudgetsService))
        private budgetsService: BudgetsService,
        private redisService: RedisService,
    ) {}

    async create(userId: number, dto: CreateExpenseDto): Promise<Expense>{
        await this.categoriesService.findOne(dto.categoryId, userId);
        const expense = this.expenseRepository.create({
            ...dto,
            userId,
            expenseDate: new Date(dto.expenseDate),
        });
        const saved = await this.expenseRepository.save(expense);
        await this.clearDashboardCache(userId);
        const date = new Date(dto.expenseDate);
        const alert = await this.budgetsService.checkBudgetAlert(
            userId,
            dto.categoryId,
            date.getMonth() + 1,
            date.getFullYear(),
        );
        return {
            ...saved,
            budgetAlert: alert?.alertTriggered?alert:null,
        } as Expense & { budgetAlert: any };
    }

    async findAll(userId: number, query: QueryExpenseDto) {
        const {
            type,
            categoryId,
            startDate,
            endDate,
            month,
            year,
            page = 1,
            limit = 10,
        } = query;

        const qb = this.expenseRepository.createQueryBuilder('expense').leftJoinAndSelect('expense.category', 'category')
              .where('expense.user_id = :userId', {userId}).andWhere('expense.isDeleted = false').orderBy('expense.expense_date', 'DESC')
              .addOrderBy('expense.created_at', 'DESC');

        if(type){
            qb.andWhere('expense.type = :type', {type});
        }
        if(categoryId){
            qb.andWhere('expense.category_id = :categoryId', {categoryId});
        }
        if(startDate && endDate){
            qb.andWhere('expense.expense_date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        if (month && year) {
            qb.andWhere('MONTH(expense.expense_date) = :month', {month}).andWhere('YEAR(expnese.expense_date) = :year', {year});
        } else if (year) {
            qb.andWhere('YEAR(expense.expense_date) = :year', {year});
        }
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);
        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total/limit),
                hasNextPage: page < Math.ceil(total/limit),
                hasPrePage: page > 1,
            },
        };
     }

     async findOne(id: number, userId: number): Promise<Expense>{
        const expense = await this.expenseRepository.findOne({
            where: {id, isDeleted: false},
            relations: ['category'],
        });
        if(!expense){
            throw new NotFoundException(`Expense #${id} not found`);
        }
        if(expense.userId !== userId) {
            throw new ForbiddenException('You do not own this expense')
        }
        return expense;
     }

     async update(
        id: number,
        userId: number,
        dto: UpdateExpenseDto,
     ): Promise<Expense> {
        const expense = await this.findOne(id, userId);
        if(dto.categoryId) {
            await this.categoriesService.findOne(dto.categoryId, userId)
        }
        Object.assign(expense, {
            ...dto,
            expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : expense.expenseDate
        });
        const updated = await this.expenseRepository.save(expense);
        await this.clearDashboardCache(userId);
        return updated;
     }

     async remove(id: number, userId: number): Promise<{message: string}> {
        const expense = await this.findOne(id, userId);
        expense.isDeleted = true;
        await this.expenseRepository.save(expense);

        await this.expenseRepository.save(expense);
        await this.clearDashboardCache(userId);
        return {message: 'expense deleted successfully'};
     }

     async getMonthlySummary(userId: number, month: number, year: number){
        const result = await this.expenseRepository.createQueryBuilder('expense').select('expense.type', 'type')
              .addSelect('SUM(expense.amount)', 'total').addSelect('COUNT(expense.id)', 'count').where('expense.user_id = :userId', {userId})
              .andWhere('expense.is_deleted = false').andWhere('MONTH(expense.expense_date) = :month', {month})
              .andWhere('YEAR(expense.expense_date) = :year', {year}).groupBy('expense.type').getRawMany()

        const summary = {
            month,
            year,
            totalExpense: 0,
            totalIncome: 0,
            count: 0,
            balance: 0,
        };
        result.forEach((row)=> {
            if (row.type === 'expense') {
                summary.totalExpense = parseFloat(row.total);
            } else {
                summary.totalIncome = parseFloat(row.total);
            }
            summary.count += parseInt(row.count);
        });

        summary.balance = summary.totalIncome - summary.totalExpense;
        return summary;
     }

     async getCategoryBreakdown(userId: number, month: number, year: number) {
        return this.expenseRepository
            .createQueryBuilder('expense')
            .select('category.name', 'categoryName')
            .addSelect('category.icon', 'icon')
            .addSelect('category.color', 'color')
            .addSelect('SUM(expense.amount)', 'total')
            .addSelect('COUNT(expense.id)', 'count')
            .leftJoin('expense.category', 'category')
            .where('expense.user_id = :userId', { userId })
            .andWhere('expense.is_deleted = false')
            .andWhere('expense.type = :type', { type: 'expense' })
            .andWhere('MONTH(expense.expense_date) = :month', { month })
            .andWhere('YEAR(expense.expense_date) = :year', { year })
            .groupBy('expense.category_id')
            .orderBy('total', 'DESC')
            .getRawMany();
    }

    private async clearDashboardCache(userId: number): Promise<void> {
        await this.redisService.del(`dashboard:user:${userId}`);
        console.log(`Cache cleared for user ${userId}`);
    }
}