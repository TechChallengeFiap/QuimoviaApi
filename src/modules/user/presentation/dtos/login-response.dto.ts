import { ApiProperty } from '@nestjs/swagger';
import type { LoginResult } from '@/modules/user/application/use-cases/auth/login.use-case.js';
import { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';

/** Resposta do login: o token de acesso da sessão iniciada e o usuário. */
export class LoginResponseDto {
  @ApiProperty({
    type: String,
    description:
      'Token de acesso (JWT), enviado nas demais rotas no cabeçalho Authorization: Bearer <token>',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZmE4NWY2NCIsInNpZCI6IjdjOWU2Njc5In0.c2lnbmF0dXJl',
  })
  accessToken: string;

  @ApiProperty({
    type: String,
    enum: ['Bearer'],
    description: 'Tipo do token, a ser usado no cabeçalho Authorization',
    example: 'Bearer',
  })
  tokenType: 'Bearer';

  @ApiProperty({
    type: Date,
    description:
      'Data e hora em que a sessão e o token expiram; depois disso é preciso fazer login novamente',
    example: '2026-10-07T15:00:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    type: () => UserResponseDto,
    description: 'Usuário autenticado',
  })
  user: UserResponseDto;

  private constructor(data: LoginResponseDto) {
    Object.assign(this, data);
  }

  static fromResult(result: LoginResult): LoginResponseDto {
    return new LoginResponseDto({
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresAt: result.expiresAt,
      user: UserResponseDto.fromEntity(result.user),
    });
  }
}
