import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from "./users/user.module";
import { AuthModule } from "./auth/auth.module";
import { CategoriesModule } from "./categories/categories.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { ReportsModule } from "./reports/reports.module";
import { RedisModule } from "./redis/redis.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'mysql',
                host: config.get('DB_HOST'),
                port: +config.get<number>('DB_PORT', 3306),
                username: config.get('DB_USERNAME'),
                password: config.get('DB_PASSWORD'),
                database: config.get('DB_NAME'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
            }),
        }),
        ScheduleModule.forRoot(),
        RedisModule,
        UsersModule,
        AuthModule,
        CategoriesModule,
        ExpensesModule,
        BudgetsModule,
        ReportsModule,
    ],
})
export class AppModule{}