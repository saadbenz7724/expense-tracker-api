import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a custom category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  create(@CurrentUser() user: User, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.id!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories for current user' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(@CurrentUser() user: User) {
    return this.categoriesService.findAll(user.id!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.findOne(id, user.id!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 403, description: 'Cannot modify default category' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, user.id!, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete default category' })
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(id, user.id!);
  }
}