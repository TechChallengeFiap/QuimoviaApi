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
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ChangeUserRoleUseCase } from '@/modules/user/application/use-cases/users/change-user-role.use-case.js';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { FindUserByIdUseCase } from '@/modules/user/application/use-cases/users/find-user-by-id.use-case.js';
import { ListUsersUseCase } from '@/modules/user/application/use-cases/users/list-users.use-case.js';
import {
  BLOCK_USER_DENIED_MESSAGE,
  UPDATE_OTHER_USER_DENIED_MESSAGE,
  UpdateUserUseCase,
} from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { AuthGuard } from '@/modules/user/infrastructure/auth/auth.guard.js';
import { CurrentSession } from '@/modules/user/infrastructure/auth/current-session.decorator.js';
import { Roles } from '@/modules/user/infrastructure/auth/roles.decorator.js';
import {
  INSUFFICIENT_ROLE_MESSAGE,
  RolesGuard,
} from '@/modules/user/infrastructure/auth/roles.guard.js';
import { ApiRequiresAuthentication } from '@/shared/presentation/decorators/api-requires-authentication.decorator.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { ChangeUserRoleDto } from '@/modules/user/presentation/dtos/change-user-role.dto.js';
import { CreateUserDto } from '@/modules/user/presentation/dtos/create-user.dto.js';
import { ListUsersQueryDto } from '@/modules/user/presentation/dtos/list-users-query.dto.js';
import { UpdateUserDto } from '@/modules/user/presentation/dtos/update-user.dto.js';
import { UserPageResponseDto } from '@/modules/user/presentation/dtos/user-page-response.dto.js';
import { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';

const USER_ID_EXAMPLE = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const USER_NOT_FOUND_EXAMPLE = {
  message: `Usuário não encontrado(a) para o identificador "${USER_ID_EXAMPLE}".`,
  error: 'Not Found',
  statusCode: HttpStatus.NOT_FOUND,
};

const EMAIL_CONFLICT_EXAMPLE = {
  message:
    'Já existe um usuário cadastrado com o e-mail "maria.silva@quimovia.com".',
  error: 'Conflict',
  statusCode: HttpStatus.CONFLICT,
};

const INSUFFICIENT_ROLE_EXAMPLE = {
  message: INSUFFICIENT_ROLE_MESSAGE,
  error: 'Forbidden',
  statusCode: HttpStatus.FORBIDDEN,
};

const UPDATE_OTHER_USER_DENIED_EXAMPLE = {
  message: UPDATE_OTHER_USER_DENIED_MESSAGE,
  error: 'Forbidden',
  statusCode: HttpStatus.FORBIDDEN,
};

const BLOCK_USER_DENIED_EXAMPLE = {
  message: BLOCK_USER_DENIED_MESSAGE,
  error: 'Forbidden',
  statusCode: HttpStatus.FORBIDDEN,
};

const BUSINESS_RULE_EXAMPLE = {
  message: 'O nome do usuário deve ter ao menos 3 caracteres.',
  error: 'Unprocessable Entity',
  statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
};

@ApiTags('Operações dos usuários')
@Controller('users')
@UseFilters(DomainExceptionFilter)
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
    @Inject(ChangeUserRoleUseCase)
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    @Inject(DeleteUserUseCase)
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
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
  @ApiBadRequestResponse({
    description: 'Dados inválidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'name must be longer than or equal to 3 characters',
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiConflictResponse({
    description: 'Já existe um usuário cadastrado com o e-mail informado.',
    schema: { example: EMAIL_CONFLICT_EXAMPLE },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Os dados violam uma regra de negócio do usuário.',
    schema: { example: BUSINESS_RULE_EXAMPLE },
  })
  @ApiRequiresAuthentication()
  @ApiForbiddenResponse({
    description:
      'Apenas o Administrador do Sistema pode executar esta operação.',
    schema: { example: INSUFFICIENT_ROLE_EXAMPLE },
  })
  async createUser(
    @Body(validationPipeFor(CreateUserDto)) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute(createUserDto);
    return UserResponseDto.fromEntity(user);
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
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    minimum: 1,
    default: 1,
    description: 'Número da página desejada',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Quantidade de usuários por página (máximo 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Lista de usuários retornada com sucesso.',
    type: UserPageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou parâmetros de paginação inválidos.',
    schema: {
      example: {
        message: [
          'page must not be less than 1',
          'pageSize must not be greater than 100',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
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
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Identificador do usuário',
    example: USER_ID_EXAMPLE,
  })
  @ApiOkResponse({
    description: 'Usuário encontrado com sucesso.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    schema: { example: USER_NOT_FOUND_EXAMPLE },
  })
  async findUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.findUserByIdUseCase.execute(id);
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Atualiza os dados de um usuário',
    description:
      'Atualiza apenas os campos enviados. O Administrador do Sistema altera qualquer usuário; os demais perfis, só os próprios dados, sem bloquear a conta. O perfil de acesso é alterado em PATCH /users/{id}/role. As mudanças de status respeitam as regras de bloqueio: enviar ACTIVE para um usuário bloqueado realiza o desbloqueio.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Identificador do usuário',
    example: USER_ID_EXAMPLE,
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Campos a serem atualizados; todos são opcionais.',
    examples: {
      alterarNome: {
        summary: 'Altera o nome',
        description: 'Somente o nome do usuário é atualizado.',
        value: { name: 'Maria Souza' },
      },
      alterarSenha: {
        summary: 'Altera a senha',
        description: 'O próprio usuário pode trocar a sua senha.',
        value: { password: 'N0vaS3nhaForte!' },
      },
      bloquear: {
        summary: 'Bloqueia o usuário',
        description:
          'Um usuário bloqueado não consegue se autenticar. Só o Administrador do Sistema bloqueia.',
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
  @ApiBadRequestResponse({
    description: 'Dados inválidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'status must be one of the following values: ACTIVE, INACTIVE, BLOCKED',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    schema: { example: USER_NOT_FOUND_EXAMPLE },
  })
  @ApiConflictResponse({
    description: 'O novo e-mail já pertence a outro usuário.',
    schema: { example: EMAIL_CONFLICT_EXAMPLE },
  })
  @ApiUnprocessableEntityResponse({
    description: 'A alteração viola uma regra de negócio do usuário.',
    schema: { example: BUSINESS_RULE_EXAMPLE },
  })
  @ApiRequiresAuthentication()
  @ApiForbiddenResponse({
    description:
      'Quem não é Administrador do Sistema tentou alterar outro usuário ou bloquear a própria conta.',
    content: {
      'application/json': {
        examples: {
          outroUsuario: {
            summary: 'Alteração de outro usuário',
            value: UPDATE_OTHER_USER_DENIED_EXAMPLE,
          },
          bloqueio: {
            summary: 'Bloqueio da própria conta',
            value: BLOCK_USER_DENIED_EXAMPLE,
          },
        },
      },
    },
  })
  async updateUser(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateUserDto)) updateUserDto: UpdateUserDto,
    @CurrentSession() session: AuthenticatedSession,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute(
      id,
      updateUserDto,
      session,
    );
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Altera o perfil de acesso de um usuário',
    description:
      'Troca o perfil do usuário. A nova permissão vale já na próxima requisição dele, sem novo login.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Identificador do usuário',
    example: USER_ID_EXAMPLE,
  })
  @ApiBody({
    type: ChangeUserRoleDto,
    description: 'Novo perfil de acesso do usuário.',
    examples: {
      promover: {
        summary: 'Promove a gestor de operações',
        description: 'O usuário passa a ter o perfil OPERATIONS_MANAGER.',
        value: { role: UserRole.OPERATIONS_MANAGER },
      },
    },
  })
  @ApiOkResponse({
    description: 'Perfil alterado com sucesso.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Perfil ausente ou inválido.',
    schema: {
      example: {
        message: [
          'role must be one of the following values: PORT_OPERATOR, SHIPPER_DRIVER, TECHNICAL_MANAGER, OPERATIONS_MANAGER, SYSTEM_ADMIN',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    schema: { example: USER_NOT_FOUND_EXAMPLE },
  })
  @ApiRequiresAuthentication()
  @ApiForbiddenResponse({
    description:
      'Apenas o Administrador do Sistema pode executar esta operação.',
    schema: { example: INSUFFICIENT_ROLE_EXAMPLE },
  })
  async changeUserRole(
    @Param('id') id: string,
    @Body(validationPipeFor(ChangeUserRoleDto))
    changeUserRoleDto: ChangeUserRoleDto,
  ): Promise<UserResponseDto> {
    const user = await this.changeUserRoleUseCase.execute(
      id,
      changeUserRoleDto.role,
    );
    return UserResponseDto.fromEntity(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Remove um usuário',
    description: 'Remove definitivamente o usuário informado.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Identificador do usuário',
    example: USER_ID_EXAMPLE,
  })
  @ApiNoContentResponse({ description: 'Usuário removido com sucesso.' })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    schema: { example: USER_NOT_FOUND_EXAMPLE },
  })
  @ApiRequiresAuthentication()
  @ApiForbiddenResponse({
    description:
      'Apenas o Administrador do Sistema pode executar esta operação.',
    schema: { example: INSUFFICIENT_ROLE_EXAMPLE },
  })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.deleteUserUseCase.execute(id);
  }
}
