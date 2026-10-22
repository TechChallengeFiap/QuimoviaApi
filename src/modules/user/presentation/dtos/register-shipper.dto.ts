import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Cadastro público do embarcador. Não aceita perfil nem status: o embarcador
 * é sempre criado com o perfil SHIPPER_DRIVER e ativo.
 */
export class RegisterShipperDto {
  @ApiProperty({
    type: String,
    description: 'Nome completo do embarcador',
    minLength: 3,
    example: 'Carlos Pereira',
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    type: String,
    format: 'email',
    description: 'E-mail do embarcador; deve ser único no sistema',
    example: 'carlos.pereira@transportadora.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    type: String,
    format: 'password',
    description: 'Senha de acesso; é armazenada apenas como hash',
    minLength: 8,
    writeOnly: true,
    example: 'S3nhaForte!',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
