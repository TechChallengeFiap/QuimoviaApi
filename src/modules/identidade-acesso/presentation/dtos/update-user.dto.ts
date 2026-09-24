import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false, minLength: 3 })
  declare name?: string;

  @ApiProperty({ required: false })
  declare email?: string;

  @ApiProperty({ required: false, minLength: 8, writeOnly: true })
  declare password?: string;
}
