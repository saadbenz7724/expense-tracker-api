import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./category.entity";
import { Repository } from "typeorm";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { NotFoundError } from "rxjs";
import { UpdateCategoryDto } from "./dto/update-category.dto";

export const DEFAULT_CATEGORIES = [
    { name: 'Food & Dining',    icon: '🍔', color: '#FF5733' },
    { name: 'Transportation',   icon: '🚗', color: '#3498DB' },
    { name: 'Shopping',         icon: '🛍️', color: '#9B59B6' },
    { name: 'Entertainment',    icon: '🎬', color: '#F39C12' },
    { name: 'Health & Medical', icon: '💊', color: '#2ECC71' },
    { name: 'Rent & Housing',   icon: '🏠', color: '#E74C3C' },
    { name: 'Education',        icon: '📚', color: '#1ABC9C' },
    { name: 'Utilities',        icon: '💡', color: '#95A5A6' },
    { name: 'Salary',           icon: '💰', color: '#27AE60' },
    { name: 'Other',            icon: '📦', color: '#BDC3C7' },
];

@Injectable()
export class CategoriesService{
    constructor(
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
    ){}

    async seedDefaultCategories(userId: number): Promise<void>{
        const defaults = DEFAULT_CATEGORIES.map((cat)=>
            this.categoryRepo.create({
                ...cat,
                userId,
                isDefault: true,
            }),
        );
        await this.categoryRepo.save(defaults);
    }

    async create(userId: number, dto: CreateCategoryDto): Promise<Category>{
        const category = this.categoryRepo.create({
            ...dto,
            userId,
            isDefault: false,
        });
        return this.categoryRepo.save(category);
    }

    async findAll(userId: number): Promise<Category[]> {
        return this.categoryRepo.find({
            where: {userId},
            order: {isDefault: 'DESC', name: 'ASC'},
        });
    }

    async findOne(id: number, userId: number): Promise<Category> {
        const category = await this.categoryRepo.findOne({
            where: {id},
        });

        if(!category){
            throw new NotFoundException(`Category #${id} not found`)
        }
        if(category.userId !== userId){
            throw new ForbiddenException('You do not own this category');
        }
        return category;
    }

    async update(
        id: number,
        userId: number,
        dto: UpdateCategoryDto,
    ): Promise<Category> {
        const category = await this.findOne(id, userId);
        if(category.isDefault) {
            throw new ForbiddenException('default categories can not be modified')
        }
        Object.assign(category, dto)
        return this.categoryRepo.save(category)
    }

    async remove(id: number, userId: number): Promise<{message: string}>{
        const category = await this.findOne(id, userId);
        if(category.isDefault){
            throw new ForbiddenException('default categories can not be deleted');
        }
        await this.categoryRepo.remove(category);
        return {message: 'Category deleted successfully'};
    }
}