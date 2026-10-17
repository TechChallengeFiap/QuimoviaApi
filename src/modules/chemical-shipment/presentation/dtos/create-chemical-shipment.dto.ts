import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChemicalShipmentDTO {
  @ApiProperty({
    type: String,
    description: 'ID do produto',
    example: 'prod-001',
  })
  @IsString({ message: 'O productId deve ser uma string' })
  @IsNotEmpty({ message: 'O productId não pode estar vazio' })
  productId: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Quantidade de produto químico',
    example: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'A quantidade do produto deve ser um número' })
  quantityProduct?: number;

  @ApiProperty({
    type: String,
    description: 'ID do usuário responsável',
    example: 'user-001',
  })
  @IsString({ message: 'O responsibleUserId deve ser uma string' })
  @IsNotEmpty({ message: 'O responsibleUserId não pode estar vazio' })
  responsibleUserId: string;

  @ApiProperty({
    type: String,
    description: 'ID da documentação',
    example: 'doc-001',
  })
  @IsString({ message: 'O documentsIds deve ser uma string' })
  @IsNotEmpty({ message: 'O documentsIds não pode estar vazio' })
  documentsIds: string;
}
