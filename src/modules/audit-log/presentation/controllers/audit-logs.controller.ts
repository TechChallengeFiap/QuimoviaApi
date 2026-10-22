import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ListAuditLogsUseCase } from '@/modules/audit-log/application/use-cases/list-audit-logs.use-case.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { ListAuditLogsQueryDto } from '@/modules/audit-log/presentation/dtos/list-audit-logs-query.dto.js';
import { AuditLogPageResponseDto } from '@/modules/audit-log/presentation/dtos/audit-log-page-response.dto.js';
import { AuditLogResponseDto } from '@/modules/audit-log/presentation/dtos/audit-log-response.dto.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { AuthGuard } from '@/modules/user/infrastructure/auth/auth.guard.js';
import { Roles } from '@/modules/user/infrastructure/auth/roles.decorator.js';
import {
  INSUFFICIENT_ROLE_MESSAGE,
  RolesGuard,
} from '@/modules/user/infrastructure/auth/roles.guard.js';
import { ApiRequiresAuthentication } from '@/shared/presentation/decorators/api-requires-authentication.decorator.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';

const INSUFFICIENT_ROLE_EXAMPLE = {
  message: INSUFFICIENT_ROLE_MESSAGE,
  error: 'Forbidden',
  statusCode: HttpStatus.FORBIDDEN,
};

@ApiTags('Auditoria e Logs')
@Controller('logs')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SYSTEM_ADMIN)
@ApiRequiresAuthentication()
@ApiExtraModels(AuditLogPageResponseDto, AuditLogResponseDto)
@ApiForbiddenResponse({
  description: 'Apenas o Administrador do Sistema pode consultar logs de auditoria.',
  schema: { example: INSUFFICIENT_ROLE_EXAMPLE },
})
@UseFilters(DomainExceptionFilter)
export class AuditLogsController {
  constructor(
    @Inject(ListAuditLogsUseCase)
    private readonly listLogsUseCase: ListAuditLogsUseCase,
  ) {}

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista histórico de ações dos usuários',
    description:
      'Retorna registros de auditoria relacionados a usuários (criação, edição, login, logout, troca de perfil e exclusão).',
  })
  @ApiQuery({ type: ListAuditLogsQueryDto })
  @ApiOkResponse({
    description: 'Lista paginada de logs de usuários retornada com sucesso.',
    type: AuditLogPageResponseDto,
  })
  async listUserLogs(
    @Query(validationPipeFor(ListAuditLogsQueryDto)) query: ListAuditLogsQueryDto,
  ): Promise<AuditLogPageResponseDto> {
    const page = await this.listLogsUseCase.execute({
      entityType: AuditedEntity.USER,
      entityId: query.entityId,
      actorId: query.actorId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
    return AuditLogPageResponseDto.fromPage(page);
  }

  @Get('chemical-products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista histórico de ações em produtos químicos',
    description:
      'Retorna registros de auditoria de produtos químicos (cadastro, alteração cadastral, mudança de status, inclusão e remoção de documentos e exclusão).',
  })
  @ApiQuery({ type: ListAuditLogsQueryDto })
  @ApiOkResponse({
    description: 'Lista paginada de logs de produtos químicos retornada com sucesso.',
    type: AuditLogPageResponseDto,
  })
  async listChemicalProductLogs(
    @Query(validationPipeFor(ListAuditLogsQueryDto)) query: ListAuditLogsQueryDto,
  ): Promise<AuditLogPageResponseDto> {
    const page = await this.listLogsUseCase.execute({
      entityType: AuditedEntity.CHEMICAL_PRODUCT,
      entityId: query.entityId,
      actorId: query.actorId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
    return AuditLogPageResponseDto.fromPage(page);
  }

  @Get('chemical-shipments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista histórico de ações em cargas químicas',
    description:
      'Retorna registros de auditoria de cargas químicas (cadastro, alteração de status/quantidade/documentos e exclusão).',
  })
  @ApiQuery({ type: ListAuditLogsQueryDto })
  @ApiOkResponse({
    description: 'Lista paginada de logs de cargas químicas retornada com sucesso.',
    type: AuditLogPageResponseDto,
  })
  async listChemicalShipmentLogs(
    @Query(validationPipeFor(ListAuditLogsQueryDto)) query: ListAuditLogsQueryDto,
  ): Promise<AuditLogPageResponseDto> {
    const page = await this.listLogsUseCase.execute({
      entityType: AuditedEntity.CHEMICAL_SHIPMENT,
      entityId: query.entityId,
      actorId: query.actorId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
    return AuditLogPageResponseDto.fromPage(page);
  }

  @Get('inspections')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista histórico de ações em inspeções',
    description:
      'Retorna registros de auditoria de inspeções (cadastro, reatribuição de fiscal, registro de resultados, mudança de status e exclusão).',
  })
  @ApiQuery({ type: ListAuditLogsQueryDto })
  @ApiOkResponse({
    description: 'Lista paginada de logs de inspeções retornada com sucesso.',
    type: AuditLogPageResponseDto,
  })
  async listInspectionLogs(
    @Query(validationPipeFor(ListAuditLogsQueryDto)) query: ListAuditLogsQueryDto,
  ): Promise<AuditLogPageResponseDto> {
    const page = await this.listLogsUseCase.execute({
      entityType: AuditedEntity.INSPECTION,
      entityId: query.entityId,
      actorId: query.actorId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
    return AuditLogPageResponseDto.fromPage(page);
  }

  @Get('shipment-documents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista histórico de ações em documentações de cargas',
    description:
      'Retorna registros de auditoria de documentos de conformidade de cargas (criação, inclusão/substituição/remoção de anexos e exclusão).',
  })
  @ApiQuery({ type: ListAuditLogsQueryDto })
  @ApiOkResponse({
    description: 'Lista paginada de logs de documentações de cargas retornada com sucesso.',
    type: AuditLogPageResponseDto,
  })
  async listShipmentDocumentLogs(
    @Query(validationPipeFor(ListAuditLogsQueryDto)) query: ListAuditLogsQueryDto,
  ): Promise<AuditLogPageResponseDto> {
    const page = await this.listLogsUseCase.execute({
      entityType: AuditedEntity.SHIPMENT_DOCUMENT,
      entityId: query.entityId,
      actorId: query.actorId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
    return AuditLogPageResponseDto.fromPage(page);
  }
}
