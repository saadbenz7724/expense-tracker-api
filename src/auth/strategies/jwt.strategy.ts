import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from "src/users/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
        });
    }
    async validate(payload: {sub: number; email: string}){
        const user = await this.usersService.findById(payload.sub);
        if (!user){
            throw new UnauthorizedException('User not found')
        }
        return user;
    }
}