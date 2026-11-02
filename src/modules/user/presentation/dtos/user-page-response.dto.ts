import { ApiProperty } from '@nestjs/swagger';
import { UserPage } from '@/modules/user/domain/repositories/user.repository.js';
import { UserResponseDto } from './user-response.dto.js';

export class UserPageResponseDto {
  @ApiProperty({
    type: [UserResponseDto],
    description: 'Usuários da página solicitada',
  })
  items: UserResponseDto[];

  @ApiProperty({
    type: Number,
    description: 'Total de usuários que atendem aos filtros informados',
    example: 42,
  })
  total: number;

  @ApiProperty({
    type: Number,
    description: 'Número da página retornada',
    example: 1,
  })
  page: number;

  @ApiProperty({
    type: Number,
    description: 'Quantidade máxima de usuários por página',
    example: 20,
  })
  pageSize: number;

  private constructor(data: UserPageResponseDto) {
    Object.assign(this, data);
  }

  static fromPage(page: UserPage): UserPageResponseDto {
    return new UserPageResponseDto({
      items: page.items.map((user) => UserResponseDto.fromEntity(user)),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }
}
