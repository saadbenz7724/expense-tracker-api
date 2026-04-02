import { IsDate, IsDateString, IsEnum, IsNumber, IsOptional, Min } from "class-validator";
import { ExpenseType } from "../expense.entity";
import { Type } from 'class-transformer';

export class QueryExpenseDto {
    @IsOptional()
    @IsEnum(ExpenseType)
    type?: ExpenseType;

    @IsOptional()
    @Type(()=> Number)
    @IsNumber()
    categoryId?: number;

    @IsOptional()
    @IsDateString()
    startDate?: string

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Type(()=> Number)
    @IsNumber()
    month?: number;

    @IsOptional()
    @Type(()=> Number)
    @IsNumber()
    year?: number;

    @IsOptional()
    @Type(()=> Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(()=> Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;
}