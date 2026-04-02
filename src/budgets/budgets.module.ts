import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Budget } from "./budget.entity";
import { CategoriesModule } from "src/categories/categories.module";
import { ExpensesModule } from "src/expenses/expenses.module";
import { BudgetsService } from "./budgets.service";
import { BudgetsController } from "./budgets.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Budget]),
        CategoriesModule,
        forwardRef(()=> ExpensesModule),
    ],
    providers: [BudgetsService],
    controllers: [BudgetsController],
    exports: [BudgetsService],
})
export class BudgetsModule{}