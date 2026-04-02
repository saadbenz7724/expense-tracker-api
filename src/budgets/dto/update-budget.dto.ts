import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateBudgetDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    limitAmount?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    alertPercentage?: number;
}