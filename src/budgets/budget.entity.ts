import { Category } from "src/categories/category.entity";
import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('budgets')
export class Budget{
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ name: 'limit_amount', type: 'decimal', precision: 10, scale: 2 })
    limitAmount?: number;

    @Column({ type: 'int' })
    month?: number;

    @Column({ type: 'int' })
    year?: number;

    @Column({ name: 'alert_percentage', type: 'int', default: 80 })
    alertPercentage?: number;

    @Column({ name: 'is_alert_sent', default: false })
    isAlertSent?: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt?: Date;

    // Relations
    @ManyToMany(() => User, (user) => user.budgets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column({ name: 'user_id' })
    userId?: number;

    @ManyToOne(() => Category, (category) => category.budgets)
    @JoinColumn({ name: 'category_id' })
    category?: Category;

    @Column({ name: 'category_id' })
    categoryId?: number;
}