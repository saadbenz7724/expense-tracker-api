import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/expense.entity';
import { Budget } from '../budgets/budget.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    private redisService: RedisService,
  ) {}

  async getMonthlySummary(userId: number, month: number, year: number) {
    const totals = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.type', 'type')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.is_deleted = false')
      .andWhere('MONTH(expense.expense_date) = :month', { month })
      .andWhere('YEAR(expense.expense_date) = :year', { year })
      .groupBy('expense.type')
      .getRawMany();

    const summary = {
      month,
      year,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    };

    totals.forEach((row) => {
      if (row.type === 'income') {
        summary.totalIncome = parseFloat(row.total || '0');
      } else {
        summary.totalExpense = parseFloat(row.total || '0');
      }
      summary.transactionCount += parseInt(row.count || '0');
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    const categoryBreakdown = await this.getCategoryBreakdown(
      userId,
      month,
      year,
    );

    const budgetStatus = await this.getBudgetStatus(userId, month, year);

    return {
      summary,
      categoryBreakdown,
      budgetStatus,
    };
  }

  async getCategoryBreakdown(userId: number, month: number, year: number) {
    const rows = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
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

    const grandTotal = rows.reduce(
      (sum, row) => sum + parseFloat(row.total || '0'),
      0,
    );

    return rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      icon: row.icon,
      color: row.color,
      total: parseFloat(row.total || '0'),
      count: parseInt(row.count || '0'),
      percentage:
        grandTotal > 0
          ? parseFloat(
              ((parseFloat(row.total) / grandTotal) * 100).toFixed(1),
            )
          : 0,
    }));
  }

  async getYearlyOverview(userId: number, year: number) {
    const rows = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('MONTH(expense.expense_date)', 'month')
      .addSelect('expense.type', 'type')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.is_deleted = false')
      .andWhere('YEAR(expense.expense_date) = :year', { year })
      .groupBy('MONTH(expense.expense_date)')
      .addGroupBy('expense.type')
      .orderBy('month', 'ASC')
      .getRawMany();

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const monthlyData = monthNames.map((name, index) => ({
      month: index + 1,
      monthName: name,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    }));

    rows.forEach((row) => {
      const monthIndex = parseInt(row.month) - 1;
      if (row.type === 'income') {
        monthlyData[monthIndex].totalIncome = parseFloat(row.total || '0');
      } else {
        monthlyData[monthIndex].totalExpense = parseFloat(row.total || '0');
      }
      monthlyData[monthIndex].transactionCount += parseInt(row.count || '0');
    });

    monthlyData.forEach((m) => {
      m.balance = m.totalIncome - m.totalExpense;
    });

    const yearlyTotals = {
      totalIncome: monthlyData.reduce((s, m) => s + m.totalIncome, 0),
      totalExpense: monthlyData.reduce((s, m) => s + m.totalExpense, 0),
      balance: 0,
      totalTransactions: monthlyData.reduce(
        (s, m) => s + m.transactionCount,
        0,
      ),
    };
    yearlyTotals.balance = yearlyTotals.totalIncome - yearlyTotals.totalExpense;

    return {
      year,
      yearlyTotals,
      monthlyBreakdown: monthlyData,
    };
  }

  async getBudgetStatus(userId: number, month: number, year: number) {
    const budgets = await this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.category', 'category')
      .where('budget.user_id = :userId', { userId })
      .andWhere('budget.month = :month', { month })
      .andWhere('budget.year = :year', { year })
      .getMany();

    if (budgets.length === 0) return [];

    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        const result = await this.expenseRepository
          .createQueryBuilder('expense')
          .select('SUM(expense.amount)', 'totalSpent')
          .where('expense.user_id = :userId', { userId })
          .andWhere('expense.category_id = :categoryId', {
            categoryId: budget.categoryId,
          })
          .andWhere('expense.type = :type', { type: 'expense' })
          .andWhere('expense.is_deleted = false')
          .andWhere('MONTH(expense.expense_date) = :month', { month })
          .andWhere('YEAR(expense.expense_date) = :year', { year })
          .getRawOne();

        const spentAmount = parseFloat(result?.totalSpent || '0');
        const limitAmount = Number(budget.limitAmount);
        const percentage =
          limitAmount > 0
            ? parseFloat(((spentAmount / limitAmount) * 100).toFixed(1))
            : 0;

        let status: string;
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= budget.alertPercentage!) status = 'warning';
        else status = 'safe';

        return {
          budgetId: budget.id,
          category: budget.category!.name,
          icon: budget.category!.icon,
          color: budget.category!.colour,
          limitAmount,
          spentAmount,
          remaining: Math.max(0, limitAmount - spentAmount),
          percentage,
          status,
        };
      }),
    );

    return budgetStatus;
  }

  async getRecentTransactions(userId: number, limit: number = 10) {
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.is_deleted = false')
      .orderBy('expense.expense_date', 'DESC')
      .addOrderBy('expense.created_at', 'DESC')
      .take(limit)
      .getMany();

    return {
      count: expenses.length,
      transactions: expenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        type: e.type,
        description: e.description,
        expenseDate: e.expenseDate,
        category: {
          name: e.category!.name,
          icon: e.category!.icon,
          color: e.category!.colour,
        },
      })),
    };
  }

  async getDashboard(userId: number) {
    const cacheKey = `dashboard:user:${userId}`;
    const CACHE_TTL = 300; 

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
        console.log(`Cache HIT for user ${userId}`);
        return {
            ...(cached as object),
            fromCache: true,
            cachedAt: (cached as any).generatedAt,
          };
        }

    console.log(`Cache MISS for user ${userId} — querying database`);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [monthlySummary, yearlyOverview, recentTransactions] =
        await Promise.all([
            this.getMonthlySummary(userId, month, year),
            this.getYearlyOverview(userId, year),
            this.getRecentTransactions(userId, 5),
        ]);

    const dashboard = {
        currentMonth: { month, year },
        monthlySummary,
        yearlyOverview,
        recentTransactions,
        generatedAt: new Date().toISOString(),
        fromCache: false,
    };

    await this.redisService.set(cacheKey, dashboard, CACHE_TTL);

    return dashboard;
  }

  async checkCacheExists(key: string): Promise<boolean> {
    return this.redisService.exists(key);
  }

  async getCacheTtl(key: string): Promise<number> {
    return this.redisService.getTtl(key);
  }
}