import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get full dashboard — Redis cached for 5 minutes' })
  @ApiResponse({ status: 200, description: 'Dashboard data with cache info' })
  getDashboard(@CurrentUser() user: User) {
    return this.reportsService.getDashboard(user.id!);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly summary — income, expense, balance' })
  @ApiResponse({ status: 200, description: 'Monthly financial summary' })
  @ApiQuery({ name: 'month', required: false, type: Number, example: 3 })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2025 })
  getMonthlySummary(
    @CurrentUser() user: User,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.reportsService.getMonthlySummary(user.id!, month, year);
  }

  @Get('yearly')
  @ApiOperation({ summary: 'Get yearly overview — month by month breakdown' })
  @ApiResponse({ status: 200, description: 'Yearly financial overview' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2025 })
  getYearlyOverview(
    @CurrentUser() user: User,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.reportsService.getYearlyOverview(user.id!, year);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get category wise spending breakdown' })
  @ApiResponse({ status: 200, description: 'Category breakdown with percentages' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getCategoryBreakdown(
    @CurrentUser() user: User,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.reportsService.getCategoryBreakdown(user.id!, month, year);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent transactions' })
  @ApiResponse({ status: 200, description: 'Recent transaction list' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  getRecentTransactions(
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reportsService.getRecentTransactions(user.id!, limit);
  }

  @Get('budget-status')
  @ApiOperation({ summary: 'Get budget status for a month' })
  @ApiResponse({ status: 200, description: 'Budget usage status per category' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getBudgetStatus(
    @CurrentUser() user: User,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.reportsService.getBudgetStatus(user.id!, month, year);
  }

  @Get('cache-status')
  @ApiOperation({ summary: 'Check Redis cache status for dashboard' })
  @ApiResponse({ status: 200, description: 'Cache info with TTL remaining' })
  async getCacheStatus(@CurrentUser() user: User) {
    const cacheKey = `dashboard:user:${user.id}`;
    const exists = await this.reportsService.checkCacheExists(cacheKey);
    const ttl = await this.reportsService.getCacheTtl(cacheKey);
    return {
      userId: user.id,
      cacheKey,
      isCached: exists,
      expiresInSeconds: ttl > 0 ? ttl : null,
      expiresIn: ttl > 0 ? `${ttl} seconds` : 'not cached',
    };
  }
}