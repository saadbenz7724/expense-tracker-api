import { BadRequestException, ConflictException, HttpException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UsersService{
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ){}

    async  findByEmail(email: string): Promise<User | null>{
        return this.userRepo.findOne({where: {email}});
    }

    async findById(id: number): Promise<User | null>{
        return this.userRepo.findOne({where: {id}});
    }

    async create(data: Partial<User>): Promise<User>{
        if (!data.email) {
            throw new BadRequestException('Email is required');
        }
        const existing = await this.findByEmail(data.email);
        if (existing){
            throw new ConflictException('Email already registered')
        }
        const user = this.userRepo.create(data);
        return this.userRepo.save(user);
    }
}