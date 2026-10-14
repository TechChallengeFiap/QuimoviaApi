import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    type: String,
    format: 'email',
    description: 'E-mail cadastrado do usuário',
    example: 'maria.silva@quimovia.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    type: String,
    format: 'password',
    description: 'Senha do usuário',
    writeOnly: true,
    example: 'S3nhaForte!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
