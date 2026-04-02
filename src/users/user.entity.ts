import { RefreshToken } from "src/auth/refresh-token.entity";
import { Budget } from "src/budgets/budget.entity";
import { Category } from "src/categories/category.entity";
import { Expense } from "src/expenses/expense.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class User{
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({name: 'full_name'})
    fullname?: string;

    @Column({unique: true})
    email?: string;

    @Column()
    password?: string;

    @Column({name: 'monthly_incomme', type: 'decimal', precision: 10, scale: 2, default: 0})
    monthlyIncome?: number;

    @CreateDateColumn({name: 'created_at'})
    createdAt?: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt?: Date;

    @OneToMany(()=> Expense, (expense)=>expense.user)
    expenses?: Expense[];

    @OneToMany(() => Category, (category) => category.user)
    categories?: Category[];

    @OneToMany(() => Budget, (budget) => budget.user)
    budgets?: Budget[];

    @OneToMany(() => RefreshToken, (token) => token.user)
    refreshTokens?: RefreshToken[];
}