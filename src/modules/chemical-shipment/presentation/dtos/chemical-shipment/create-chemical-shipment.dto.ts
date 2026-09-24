import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChemicalShipmentDTO {
  @ApiProperty({
    description: 'ID do produto',
    example: 'prod-001',
  })
  @IsString({ message: 'O productId deve ser uma string' })
  @IsNotEmpty({ message: 'O productId não pode estar vazio' })
  productId: string;

  @ApiProperty({
    description: 'ID do usuário responsável',
    example: 'user-001',
  })
  @IsString({ message: 'O responsibleUserId deve ser uma string' })
  @IsNotEmpty({ message: 'O responsibleUserId não pode estar vazio' })
  responsibleUserId: string;

  @ApiProperty({
    description: 'ID da documentação',
    example: 'doc-001',
  })
  @IsString({ message: 'O documentsIds deve ser uma string' })
  @IsNotEmpty({ message: 'O documentsIds não pode estar vazio' })
  documentsIds: string;
}
