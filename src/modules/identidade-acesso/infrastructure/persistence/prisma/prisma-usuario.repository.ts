import { Injectable } from '@nestjs/common';
import {
  FiltrosDeBuscaDeUsuarios,
  PaginaDeUsuarios,
  UsuarioRepository,
} from '../../../domain/repositories/usuario.repository.js';
import { Usuario } from '../../../domain/entities/usuario.entity.js';
import { PerfilUsuario } from '../../../domain/enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../../../domain/enums/status-usuario.enum.js';
import type { UsuarioModel as UsuarioPersistido } from '#generated/prisma/models.js';
import { PrismaService } from '#shared/infrastructure/persistence/prisma/prisma.service.js';

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(usuario: Usuario): Promise<Usuario> {
    const registro = await this.prisma.usuario.create({
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        senhaHash: usuario.senhaHash,
        perfil: usuario.perfil,
        status: usuario.status,
        ultimoLogin: usuario.ultimoLogin,
      },
    });

    return PrismaUsuarioRepository.paraDominio(registro);
  }

  async atualizar(usuario: Usuario): Promise<Usuario> {
    const registro = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nome: usuario.nome,
        email: usuario.email,
        senhaHash: usuario.senhaHash,
        perfil: usuario.perfil,
        status: usuario.status,
        ultimoLogin: usuario.ultimoLogin,
      },
    });

    return PrismaUsuarioRepository.paraDominio(registro);
  }

  async remover(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { id } });

    return registro ? PrismaUsuarioRepository.paraDominio(registro) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { email } });

    return registro ? PrismaUsuarioRepository.paraDominio(registro) : null;
  }

  async listar(filtros: FiltrosDeBuscaDeUsuarios): Promise<PaginaDeUsuarios> {
    const where = {
      ...(filtros.perfil ? { perfil: filtros.perfil } : {}),
      ...(filtros.status ? { status: filtros.status } : {}),
    };

    const [registros, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip: (filtros.pagina - 1) * filtros.itensPorPagina,
        take: filtros.itensPorPagina,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      itens: registros.map((registro) => PrismaUsuarioRepository.paraDominio(registro)),
      total,
      pagina: filtros.pagina,
      itensPorPagina: filtros.itensPorPagina,
    };
  }

  private static paraDominio(registro: UsuarioPersistido): Usuario {
    return Usuario.restaurar({
      id: registro.id,
      nome: registro.nome,
      email: registro.email,
      senhaHash: registro.senhaHash,
      perfil: registro.perfil as PerfilUsuario,
      status: registro.status as StatusUsuario,
      ultimoLogin: registro.ultimoLogin,
      criadoEm: registro.criadoEm,
      atualizadoEm: registro.atualizadoEm,
    });
  }
}
