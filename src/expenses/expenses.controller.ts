import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Expenses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense or income' })
  @ApiResponse({ status: 201, description: 'Expense created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@CurrentUser() user: User, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.id!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated expense list' })
  @ApiQuery({ name: 'type', required: false, enum: ['expense', 'income'] })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: User,
    @Query() query: QueryExpenseDto,
  ) {
    return this.expensesService.findAll(user.id!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense found' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expensesService.findOne(id, user.id!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiResponse({ status: 200, description: 'Expense updated' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, user.id!, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted' })
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expensesService.remove(id, user.id!);
  }
}