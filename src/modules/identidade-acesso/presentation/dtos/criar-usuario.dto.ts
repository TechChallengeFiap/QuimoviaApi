import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PerfilUsuario } from '../../domain/enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../../domain/enums/status-usuario.enum.js';

export class CriarUsuarioDto {
  @ApiProperty({ example: 'Maria Silva', minLength: 3 })
  @IsString()
  @MinLength(3)
  nome!: string;

  @ApiProperty({ example: 'maria.silva@quimovia.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3nhaForte!', minLength: 8, writeOnly: true })
  @IsString()
  @MinLength(8)
  senha!: string;

  @ApiProperty({ enum: PerfilUsuario, example: PerfilUsuario.OPERADOR_PORTUARIO })
  @IsEnum(PerfilUsuario)
  perfil!: PerfilUsuario;

  @ApiProperty({ enum: StatusUsuario, required: false, example: StatusUsuario.ATIVO })
  @IsOptional()
  @IsEnum(StatusUsuario)
  status?: StatusUsuario;
}
