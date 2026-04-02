import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RefreshToken } from "./refresh-token.entity";
import { UsersModule } from "src/users/user.module";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthController } from "./auth.controller";
import { CategoriesModule } from "src/categories/categories.module";

@Module({
    imports: [
        PassportModule,
        JwtModule.register({}),
        TypeOrmModule.forFeature([RefreshToken]),
        UsersModule,
        CategoriesModule,
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
})
export class AuthModule{}