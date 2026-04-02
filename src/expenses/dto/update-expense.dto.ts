import { IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from "class-validator";
import { ExpenseType } from "../expense.entity";

export class UpdateExpenseDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    amount?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ExpenseType)
    type?: ExpenseType;

    @IsOptional()
    @IsDateString()
    expenseDate?: string;

    @IsOptional()
    @IsNumber()
    categoryId?: number;
}