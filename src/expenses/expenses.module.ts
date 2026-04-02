import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Expense } from "./expense.entity";
import { CategoriesModule } from "src/categories/categories.module";
import { ExpensesService } from "./expenses.service";
import { ExpensesController } from "./expenses.controller";
import { BudgetsModule } from "src/budgets/budgets.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Expense]),
        CategoriesModule,
        forwardRef(()=> BudgetsModule),
    ],
    providers: [ExpensesService],
    controllers: [ExpensesController],
    exports: [ExpensesService],
})
export class ExpensesModule{}