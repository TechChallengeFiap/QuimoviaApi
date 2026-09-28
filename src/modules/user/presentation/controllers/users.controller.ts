import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { FindUserByIdUseCase } from '@/modules/user/application/use-cases/users/find-user-by-id.use-case.js';
import { ListUsersUseCase } from '@/modules/user/application/use-cases/users/list-users.use-case.js';
import { UpdateUserUseCase } from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { CreateUserDto } from '@/modules/user/presentation/dtos/create-user.dto.js';
import { ListUsersQueryDto } from '@/modules/user/presentation/dtos/list-users-query.dto.js';
import { UpdateUserDto } from '@/modules/user/presentation/dtos/update-user.dto.js';
import { UserPageResponseDto } from '@/modules/user/presentation/dtos/user-page-response.dto.js';
import { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';

@ApiTags('Operações dos usuários')
@Controller('usuarios')
@UseFilters(DomainExceptionFilter)
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'E-mail já cadastrado' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUser.execute(dto);
    return UserResponseDto.fromEntity(user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista usuários, com filtro por perfil e status' })
  @ApiResponse({ status: HttpStatus.OK, type: UserPageResponseDto })
  async list(@Query() query: ListUsersQueryDto): Promise<UserPageResponseDto> {
    const page = await this.listUsers.execute(query);
    return UserPageResponseDto.fromPage(page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário pelo id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.findUserById.execute(id);
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um usuário' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'E-mail já cadastrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUser.execute(id, dto);
    return UserResponseDto.fromEntity(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um usuário' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUser.execute(id);
  }
}
