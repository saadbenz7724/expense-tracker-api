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
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Budgets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a budget for a category' })
  @ApiResponse({ status: 201, description: 'Budget created' })
  @ApiResponse({ status: 409, description: 'Budget already exists for this category and month' })
  create(@CurrentUser() user: User, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(user.id!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets with live usage stats' })
  @ApiResponse({ status: 200, description: 'Budget list with spending data' })
  findAll(@CurrentUser() user: User, @Query() query: QueryBudgetDto) {
    return this.budgetsService.findAll(user.id!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single budget with usage' })
  @ApiResponse({ status: 200, description: 'Budget with spending stats' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetsService.findOne(id, user.id!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget limit or alert percentage' })
  @ApiResponse({ status: 200, description: 'Budget updated' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, user.id!, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiResponse({ status: 200, description: 'Budget deleted' })
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetsService.remove(id, user.id!);
  }
}