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
import { AtualizarUsuarioUseCase } from '../../../application/usuarios/use-cases/atualizar-usuario.use-case.js';
import { BuscarUsuarioPorIdUseCase } from '../../../application/usuarios/use-cases/buscar-usuario-por-id.use-case.js';
import { CriarUsuarioUseCase } from '../../../application/usuarios/use-cases/criar-usuario.use-case.js';
import { ListarUsuariosUseCase } from '../../../application/usuarios/use-cases/listar-usuarios.use-case.js';
import { RemoverUsuarioUseCase } from '../../../application/usuarios/use-cases/remover-usuario.use-case.js';
import { DominioExceptionFilter } from '../../shared/filters/dominio-exception.filter.js';
import { AtualizarUsuarioDto } from '../dtos/atualizar-usuario.dto.js';
import { CriarUsuarioDto } from '../dtos/criar-usuario.dto.js';
import { ListarUsuariosQueryDto } from '../dtos/listar-usuarios-query.dto.js';
import { PaginaUsuariosRespostaDto } from '../dtos/pagina-usuarios-resposta.dto.js';
import { UsuarioRespostaDto } from '../dtos/usuario-resposta.dto.js';

@ApiTags('Operações dos usuários')
@Controller('usuarios')
@UseFilters(DominioExceptionFilter)
export class UsuariosController {
  constructor(
    private readonly criarUsuario: CriarUsuarioUseCase,
    private readonly listarUsuarios: ListarUsuariosUseCase,
    private readonly buscarUsuarioPorId: BuscarUsuarioPorIdUseCase,
    private readonly atualizarUsuario: AtualizarUsuarioUseCase,
    private readonly removerUsuario: RemoverUsuarioUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UsuarioRespostaDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'E-mail já cadastrado' })
  async criar(@Body() dto: CriarUsuarioDto): Promise<UsuarioRespostaDto> {
    const usuario = await this.criarUsuario.executar(dto);
    return UsuarioRespostaDto.aPartirDaEntidade(usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Lista usuários, com filtro por perfil e status' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginaUsuariosRespostaDto })
  async listar(@Query() query: ListarUsuariosQueryDto): Promise<PaginaUsuariosRespostaDto> {
    const pagina = await this.listarUsuarios.executar(query);
    return PaginaUsuariosRespostaDto.aPartirDaPagina(pagina);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário pelo id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: UsuarioRespostaDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado' })
  async buscarPorId(@Param('id') id: string): Promise<UsuarioRespostaDto> {
    const usuario = await this.buscarUsuarioPorId.executar(id);
    return UsuarioRespostaDto.aPartirDaEntidade(usuario);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um usuário' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: UsuarioRespostaDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'E-mail já cadastrado' })
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarUsuarioDto,
  ): Promise<UsuarioRespostaDto> {
    const usuario = await this.atualizarUsuario.executar(id, dto);
    return UsuarioRespostaDto.aPartirDaEntidade(usuario);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um usuário' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado' })
  async remover(@Param('id') id: string): Promise<void> {
    await this.removerUsuario.executar(id);
  }
}
