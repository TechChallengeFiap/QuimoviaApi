import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  INVALID_CREDENTIALS_MESSAGE,
  LoginUseCase,
} from '@/modules/user/application/use-cases/auth/login.use-case.js';
import { LogoutUseCase } from '@/modules/user/application/use-cases/auth/logout.use-case.js';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { AuthGuard } from '@/modules/user/presentation/guards/auth.guard.js';
import { CurrentSession } from '@/modules/user/presentation/decorators/current-session.decorator.js';
import { ApiRequiresAuthentication } from '@/modules/user/presentation/decorators/api-requires-authentication.decorator.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { LoginDto } from '@/modules/user/presentation/dtos/login.dto.js';
import { LoginResponseDto } from '@/modules/user/presentation/dtos/login-response.dto.js';
import { ApiErrorResponse } from '@/shared/presentation/docs/api-error-response.decorator.js';

const ACCOUNT_WITHOUT_ACCESS_MESSAGE =
  `Usuário com status ${UserStatus.BLOCKED} não pode autenticar-se no sistema.`;

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LoginUseCase) private readonly loginUseCase: LoginUseCase,
    @Inject(LogoutUseCase) private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica o usuário e inicia uma sessão',
    description:
      'Confere o e-mail e a senha e, se a conta estiver ativa, inicia uma sessão e devolve o token de acesso. O token vale até expiresAt ou até o logout e deve ser enviado nas demais rotas no cabeçalho Authorization: Bearer <token>.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciais do usuário.',
    examples: {
      padrao: {
        summary: 'Login com e-mail e senha',
        description: 'O e-mail é comparado sem diferenciar maiúsculas.',
        value: {
          email: 'maria.silva@quimovia.com',
          password: 'S3nhaForte!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Usuário autenticado e sessão iniciada.',
    type: LoginResponseDto,
  })
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Dados inválidos no corpo da requisição.',
    [
      'email must be an email',
      'password should not be empty',
    ],
  )
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'E-mail ou senha inválidos; a resposta não indica qual dos dois está errado.',
    INVALID_CREDENTIALS_MESSAGE,
  )
  @ApiErrorResponse(
    HttpStatus.FORBIDDEN,
    'A conta está inativa ou bloqueada.',
    ACCOUNT_WITHOUT_ACCESS_MESSAGE,
  )
  async login(
    @Body(validationPipeFor(LoginDto)) loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    const result = await this.loginUseCase.execute(loginDto);
    return LoginResponseDto.fromResult(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Encerra a sessão atual',
    description:
      'Encerra a sessão do token enviado, que deixa de valer imediatamente. As outras sessões do usuário continuam ativas.',
  })
  @ApiNoContentResponse({ description: 'Sessão encerrada.' })
  @ApiRequiresAuthentication()
  async logout(@CurrentSession() session: AuthenticatedSession): Promise<void> {
    await this.logoutUseCase.execute(session.sessionId);
  }
}
