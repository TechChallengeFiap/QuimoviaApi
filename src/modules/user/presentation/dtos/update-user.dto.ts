import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

/** Os campos do cadastro, todos opcionais e com a mesma validação. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
