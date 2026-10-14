import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { FindUserByIdUseCase } from '@/modules/user/application/use-cases/users/find-user-by-id.use-case.js';
import { ListUsersUseCase } from '@/modules/user/application/use-cases/users/list-users.use-case.js';
import { UpdateUserUseCase } from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { CreateUserDto } from '@/modules/user/presentation/dtos/create-user.dto.js';
import { ListUsersQueryDto } from '@/modules/user/presentation/dtos/list-users-query.dto.js';
import { UpdateUserDto } from '@/modules/user/presentation/dtos/update-user.dto.js';
import { UserPageResponseDto } from '@/modules/user/presentation/dtos/user-page-response.dto.js';
import { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';
import { ApiErrorResponse } from '@/shared/presentation/docs/api-error-response.decorator.js';
import { ApiPaginationQuery } from '@/shared/presentation/docs/api-pagination-query.decorator.js';
import { ApiIdParam } from '@/shared/presentation/docs/api-id-param.decorator.js';

const USER_ID_EXAMPLE = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const USER_NOT_FOUND_MESSAGE =
  `Usuário não encontrado(a) para o identificador "${USER_ID_EXAMPLE}".`;

const EMAIL_CONFLICT_MESSAGE =
  'Já existe um usuário cadastrado com o e-mail "maria.silva@quimovia.com".';

const BUSINESS_RULE_MESSAGE =
  'O nome do usuário deve ter ao menos 3 caracteres.';

@ApiTags('Operações dos usuários')
@Controller('usuarios')
export class UsersController {
  constructor(
    @Inject(CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject(ListUsersUseCase)
    private readonly listUsersUseCase: ListUsersUseCase,
    @Inject(FindUserByIdUseCase)
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    @Inject(UpdateUserUseCase)
    private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(DeleteUserUseCase)
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo usuário',
    description:
      'Cria um usuário com a senha armazenada em hash. Quando o status não é informado, o usuário é criado como ACTIVE.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Dados necessários para o cadastro do usuário.',
    examples: {
      padrao: {
        summary: 'Cadastro com os campos obrigatórios',
        description: 'Payload mínimo; o usuário é criado com o status ACTIVE.',
        value: {
          name: 'Maria Silva',
          email: 'maria.silva@quimovia.com',
          password: 'S3nhaForte!',
          role: UserRole.PORT_OPERATOR,
        },
      },
      comStatus: {
        summary: 'Cadastro informando o status',
        description:
          'Cria o usuário inativo; ele só poderá se autenticar depois de ser ativado.',
        value: {
          name: 'João Souza',
          email: 'joao.souza@quimovia.com',
          password: 'S3nhaForte!',
          role: UserRole.TECHNICAL_MANAGER,
          status: UserStatus.INACTIVE,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Usuário cadastrado com sucesso.',
    type: UserResponseDto,
  })
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Dados inválidos no corpo da requisição.',
    [
      'name must be longer than or equal to 3 characters',
      'email must be an email',
      'password must be longer than or equal to 8 characters',
    ],
  )
  @ApiErrorResponse(
    HttpStatus.CONFLICT,
    'Já existe um usuário cadastrado com o e-mail informado.',
    EMAIL_CONFLICT_MESSAGE,
  )
  @ApiErrorResponse(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Os dados violam uma regra de negócio do usuário.',
    BUSINESS_RULE_MESSAGE,
  )
  async createUser(
    @Body(validationPipeFor(CreateUserDto)) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute(createUserDto);
    return UserResponseDto.from(user);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista usuários, com filtro por perfil e status',
    description:
      'Retorna uma lista paginada de usuários, ordenada do cadastro mais recente para o mais antigo.',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Filtra os usuários pelo perfil de acesso',
    example: UserRole.PORT_OPERATOR,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UserStatus,
    enumName: 'UserStatus',
    description: 'Filtra os usuários pela situação atual',
    example: UserStatus.ACTIVE,
  })
  @ApiPaginationQuery('usuários')
  @ApiOkResponse({
    description: 'Lista de usuários retornada com sucesso.',
    type: UserPageResponseDto,
  })
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Filtros ou parâmetros de paginação inválidos.',
    [
      'page must not be less than 1',
      'pageSize must not be greater than 100',
    ],
  )
  async listUsers(
    @Query(validationPipeFor(ListUsersQueryDto)) query: ListUsersQueryDto,
  ): Promise<UserPageResponseDto> {
    const page = await this.listUsersUseCase.execute(query);
    return UserPageResponseDto.fromPage(page);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um usuário pelo id',
    description:
      'Retorna os dados de um usuário a partir do seu identificador.',
  })
  @ApiIdParam('Identificador do usuário', USER_ID_EXAMPLE)
  @ApiOkResponse({
    description: 'Usuário encontrado com sucesso.',
    type: UserResponseDto,
  })
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'Usuário não encontrado.',
    USER_NOT_FOUND_MESSAGE,
  )
  async findUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.findUserByIdUseCase.execute(id);
    return UserResponseDto.from(user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza os dados de um usuário',
    description:
      'Atualiza apenas os campos enviados. As mudanças de status respeitam as regras de bloqueio: enviar ACTIVE para um usuário bloqueado realiza o desbloqueio.',
  })
  @ApiIdParam('Identificador do usuário', USER_ID_EXAMPLE)
  @ApiBody({
    type: UpdateUserDto,
    description: 'Campos a serem atualizados; todos são opcionais.',
    examples: {
      alterarNome: {
        summary: 'Altera o nome',
        description: 'Somente o nome do usuário é atualizado.',
        value: { name: 'Maria Souza' },
      },
      alterarPerfil: {
        summary: 'Altera o perfil de acesso',
        description: 'Promove o usuário a gestor de operações.',
        value: { role: UserRole.OPERATIONS_MANAGER },
      },
      bloquear: {
        summary: 'Bloqueia o usuário',
        description: 'Um usuário bloqueado não consegue se autenticar.',
        value: { status: UserStatus.BLOCKED },
      },
      desbloquear: {
        summary: 'Desbloqueia o usuário',
        description:
          'Enviar ACTIVE para um usuário bloqueado realiza o desbloqueio.',
        value: { status: UserStatus.ACTIVE },
      },
    },
  })
  @ApiOkResponse({
    description: 'Usuário atualizado com sucesso.',
    type: UserResponseDto,
  })
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Dados inválidos no corpo da requisição.',
    [
      'status must be one of the following values: ACTIVE, INACTIVE, BLOCKED',
    ],
  )
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'Usuário não encontrado.',
    USER_NOT_FOUND_MESSAGE,
  )
  @ApiErrorResponse(
    HttpStatus.CONFLICT,
    'O novo e-mail já pertence a outro usuário.',
    EMAIL_CONFLICT_MESSAGE,
  )
  @ApiErrorResponse(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'A alteração viola uma regra de negócio do usuário.',
    BUSINESS_RULE_MESSAGE,
  )
  async updateUser(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateUserDto)) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute(id, updateUserDto);
    return UserResponseDto.from(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove um usuário',
    description: 'Remove definitivamente o usuário informado.',
  })
  @ApiIdParam('Identificador do usuário', USER_ID_EXAMPLE)
  @ApiNoContentResponse({ description: 'Usuário removido com sucesso.' })
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'Usuário não encontrado.',
    USER_NOT_FOUND_MESSAGE,
  )
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.deleteUserUseCase.execute(id);
  }
}
