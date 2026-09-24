import { ApiProperty } from '@nestjs/swagger';
import { UserPage } from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';
import { UserResponseDto } from './user-response.dto.js';

export class UserPageResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items: UserResponseDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;

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
