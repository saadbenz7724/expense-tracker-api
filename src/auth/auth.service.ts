import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "src/users/user.service";
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "./refresh-token.entity";
import { Repository } from "typeorm";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from 'bcryptjs';
import { LoginDto } from "./dto/login.dto";
import { CategoriesService } from "src/categories/categories.service";

@Injectable()
export class AuthService{
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private categoriesService: CategoriesService,
        @InjectRepository(RefreshToken)
        private refreshTokenRepo: Repository<RefreshToken>,
    ) {}

    async register(dto: RegisterDto){
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const user = await this.usersService.create({
            fullname: dto.fullName,
            email: dto.email,
            password: hashedPassword,
            monthlyIncome: dto.monthlyIncome || 0,
        });

        await this.categoriesService.seedDefaultCategories(user.id!);

        if(!user.id){
            throw new BadRequestException('User ID not found');
        }
        if(!user.email){
            throw new BadRequestException('User email not found');
        }
        const tokens = await this.generateTokens(user.id, user.email);
        return {
            message: 'Registration successfull',
            user: {
                id: user.id,
                fullName: user.fullname,
                email: user.email,
            },
            ...tokens,
        };
    }

    async login (dto: LoginDto){
        const user = await this.usersService.findByEmail(dto.email);
        if(!user || !user.password){
            throw new UnauthorizedException('Invalid email or password')
        }
        if(!user.id){
            throw new UnauthorizedException('User ID not found');
        }
        if(!user.email){
            throw new UnauthorizedException('User email not found');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid){
            throw new UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.generateTokens(user.id, user.email);
        return{
            message: 'Login Successful',
            user: {
                id: user.id,
                fullName: user.fullname,
                email: user.email,
            },
            ...tokens,
        };
    }
    async refreshToken(token: string){
        const savedToken = await this.refreshTokenRepo.findOne({
            where: {token},
            relations: ['user'],
        });
        if(!savedToken){
            throw new UnauthorizedException('Refresh token not found');
        }
        if(!savedToken.user){
            throw new UnauthorizedException('Token user not found');
        }
        if(!savedToken.user.id){
            throw new UnauthorizedException('Token user id not found');
        }
        if(!savedToken.user.email){
            throw new UnauthorizedException('Token user email not found');
        }
        if(savedToken.isRevoked){
            throw new UnauthorizedException('Refresh token has been revoked');
        }
        if(savedToken.expiresAt && new Date()>savedToken.expiresAt){
            throw new UnauthorizedException('Refresh token has expired');
        }
        savedToken.isRevoked = true;
        await this.refreshTokenRepo.save(savedToken);
        const tokens = await this.generateTokens(
            savedToken.user.id,
            savedToken.user.email,
        );
        return {
            massage: 'Token refreshed successfully',
            ...tokens,
        };
    }
    async logout(token: string){
        const savedToken = await this.refreshTokenRepo.findOne({
            where: {token},
        });
        if(!savedToken){
            throw new BadRequestException('Refresh token not found');
        }
        savedToken.isRevoked = true;
        await this.refreshTokenRepo.save(savedToken);
        return {message: 'Logged out successfully'};
    }
    private async generateTokens(userId: number, email: string){
        const payload = {sub: userId, email};
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate()+7);
        const tokenEntity = this.refreshTokenRepo.create({
            token: refreshToken,
            userId,
            expiresAt,
            isRevoked: false,
        });
        await this.refreshTokenRepo.save(tokenEntity);
        return {accessToken, refreshToken};
    }
}