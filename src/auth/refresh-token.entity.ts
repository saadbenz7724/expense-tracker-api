import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('refresh_tokens')
export class RefreshToken{
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({type: 'text'})
    token?: string;

    @Column({name: 'exipres_at'})
    expiresAt?: Date;

    @Column({name: 'is_revoked', default: false})
    isRevoked?: boolean;

    @CreateDateColumn({name: 'created_at'})
    createdAt?: Date;

    @ManyToOne(()=>User, (user)=> user.refreshTokens, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user?: User;

    @Column({name: 'user_id'})
    userId?: number;
}