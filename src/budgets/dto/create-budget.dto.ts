import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class CreateBudgetDto {
    @IsNumber()
    @Min(1)
    limitAmount!: number;

    @IsInt()
    @Min(1)
    @Max(12)
    month!: number;

    @IsInt()
    @Min(2024)
    year!: number;

    @IsInt()
    categoryId!: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    alertPercentage?: number;
}