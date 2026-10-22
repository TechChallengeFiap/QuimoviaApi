import { ApiProperty } from '@nestjs/swagger';
import type { AuditLogPage } from '@/modules/audit-log/domain/repositories/audit-log.repository.js';
import { AuditLogResponseDto } from './audit-log-response.dto.js';

export class AuditLogPageResponseDto {
  @ApiProperty({
    type: () => [AuditLogResponseDto],
    description: 'Registros de log da página solicitada',
  })
  items: AuditLogResponseDto[];

  @ApiProperty({
    type: Number,
    description: 'Total de registros encontrados',
    example: 42,
  })
  total: number;

  @ApiProperty({
    type: Number,
    description: 'Número da página retornada',
    example: 1,
  })
  page: number;

  @ApiProperty({
    type: Number,
    description: 'Quantidade de registros por página',
    example: 20,
  })
  pageSize: number;

  private constructor(data: AuditLogPageResponseDto) {
    Object.assign(this, data);
  }

  static fromPage(page: AuditLogPage): AuditLogPageResponseDto {
    return new AuditLogPageResponseDto({
      items: page.items.map((item) => AuditLogResponseDto.fromEntity(item)),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }
}
