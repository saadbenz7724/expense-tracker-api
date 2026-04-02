import { Budget } from "src/budgets/budget.entity";
import { Expense } from "src/expenses/expense.entity";
import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('categories')
export class Category{
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    name?: string;

    @Column({nullable: true})
    icon?: string;

    @Column({nullable: true})
    colour?: string;

    @Column({name: 'is_default', default: false})
    isDefault?: boolean;

    @CreateDateColumn({name: 'created_at'})
    createdAt?: Date;

    @ManyToOne(()=> User, (user)=> user.categories, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user?: User;

    @Column({name: 'user_id', nullable: true})
    userId?: number;

    @OneToMany(() => Expense, (expense) => expense.category)
    expenses?: Expense[];

    @OneToMany(() => Budget, (budget) => budget.category)
    budgets?: Budget[];
}