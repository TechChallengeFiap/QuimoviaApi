import { Body, Controller, HttpStatus, Post, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case.js';
import { DomainExceptionFilter } from '#shared/presentation/filters/domain-exception.filter.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';

@ApiTags('Operações dos usuários')
@Controller('usuarios')
@UseFilters(DomainExceptionFilter)
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'E-mail já cadastrado' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUser.execute(dto);
    return UserResponseDto.fromEntity(user);
  }
}
