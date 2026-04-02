import { Category } from "src/categories/category.entity";
import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum ExpenseType{
    EXPENSE = 'expense',
    INCOME = 'income',
}

@Entity('expenses')
export class Expense{
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({type: 'decimal', precision: 10, scale: 2})
    amount?: number;

    @Column({nullable: true})
    description?: string;

    @Column({type: 'enum', enum: ExpenseType, default: ExpenseType.EXPENSE})
    type?: ExpenseType;

    @Column({name: 'expense_date', type: 'date'})
    expenseDate?: Date;

    @Column({ name: 'is_deleted', default: false })
    isDeleted?: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column({ name: 'user_id' })
    userId?: number;

    @ManyToOne(() => Category, (category) => category.expenses)
    @JoinColumn({ name: 'category_id' })
    category?: Category;

    @Column({ name: 'category_id' })
    categoryId?: number;
}