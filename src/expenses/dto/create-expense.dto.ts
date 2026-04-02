import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ExpenseType } from "../expense.entity";

export class CreateExpenseDto {
    @IsNumber()
    @Min(1)
    amount!: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(ExpenseType)
    type!: ExpenseType;

    @IsDateString()
    expenseDate!: string;

    @IsNumber()
    categoryId!: number;
}