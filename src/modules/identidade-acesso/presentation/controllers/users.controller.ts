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
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from '@/modules/identidade-acesso/application/use-cases/users/create-user.use-case.ts';
import { DeleteUserUseCase } from '@/modules/identidade-acesso/application/use-cases/users/delete-user.use-case.ts';
import { FindUserByIdUseCase } from '@/modules/identidade-acesso/application/use-cases/users/find-user-by-id.use-case.ts';
import { ListUsersUseCase } from '@/modules/identidade-acesso/application/use-cases/users/list-users.use-case.ts';
import { UpdateUserUseCase } from '@/modules/identidade-acesso/application/use-cases/users/update-user.use-case.ts';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.ts';
import { CreateUserDto } from '@/modules/identidade-acesso/presentation/dtos/create-user.dto.ts';
import { ListUsersQueryDto } from '@/modules/identidade-acesso/presentation/dtos/list-users-query.dto.ts';
import { UpdateUserDto } from '@/modules/identidade-acesso/presentation/dtos/update-user.dto.ts';
import { UserPageResponseDto } from '@/modules/identidade-acesso/presentation/dtos/user-page-response.dto.ts';
import { UserResponseDto } from '@/modules/identidade-acesso/presentation/dtos/user-response.dto.ts';

@ApiTags('Operações dos usuários')
@Controller('usuarios')
@UseFilters(DomainExceptionFilter)
export class UsersController {
  constructor(
    @Inject(CreateUserUseCase) private readonly createUser: CreateUserUseCase,
    @Inject(ListUsersUseCase) private readonly listUsers: ListUsersUseCase,
    @Inject(FindUserByIdUseCase)
    private readonly findUserById: FindUserByIdUseCase,
    @Inject(UpdateUserUseCase) private readonly updateUser: UpdateUserUseCase,
    @Inject(DeleteUserUseCase) private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserResponseDto })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'E-mail já cadastrado',
  })
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
  })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.findUserById.execute(id);
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um usuário' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'E-mail já cadastrado',
  })
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUser.execute(id);
  }
}
