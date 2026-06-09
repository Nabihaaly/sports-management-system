import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import {Role} from "@prisma/client";

export class CreateUserDto {
    @IsEmail({}, {message: 'Please provide a valid email address'}) 
    @IsNotEmpty({message: 'Email is required'})
    email!: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    password!: string;

}