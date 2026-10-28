import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateLotDto {
  @ApiProperty({
    type: String,
    example: 'L2026-0001',
    maxLength: 60,
    description:
      'Número do lote, único dentro do produto. É normalizado para maiúsculas. Aceita letras, números, ponto, hífen, barra e sublinhado.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, {
    message: 'lotNumber deve conter apenas letras, números, ponto, hífen, barra ou sublinhado',
  })
  lotNumber!: string;

  @ApiProperty({
    type: Number,
    example: 1500.5,
    description: 'Quantidade recebida, maior que zero, com até 3 casas decimais.',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity!: number;
}
