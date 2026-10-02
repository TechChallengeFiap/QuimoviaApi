import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ type: String, required: false, minLength: 3 })
  declare name?: string;

  @ApiProperty({ type: String, format: 'email', required: false })
  declare email?: string;

  @ApiProperty({
    type: String,
    format: 'password',
    required: false,
    minLength: 8,
    writeOnly: true,
  })
  declare password?: string;
}
