import { jest } from '@jest/globals';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import {
  AccessDeniedError,
  AuthenticationError,
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockHttpAdapter: { reply: jest.Mock };
  let mockHost: ArgumentsHost;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    mockHttpAdapter = { reply: jest.fn() };
    const httpAdapterHost = {
      httpAdapter: mockHttpAdapter,
    } as unknown as HttpAdapterHost;
    filter = new DomainExceptionFilter(httpAdapterHost);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
        getNext: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('deve traduzir ResourceNotFoundError para 404 via httpAdapter', () => {
    const error = new ResourceNotFoundError('Carga Química', 'id-123');

    filter.catch(error, mockHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      mockResponse,
      expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND }),
      HttpStatus.NOT_FOUND,
    );
  });

  it.each([
    [
      'BusinessRuleError',
      HttpStatus.BAD_REQUEST,
      new BusinessRuleError('A quantidade deve ser maior que zero.'),
    ],
    [
      'ConflictError',
      HttpStatus.CONFLICT,
      new ConflictError('O recurso já existe.'),
    ],
    [
      'AuthenticationError',
      HttpStatus.UNAUTHORIZED,
      new AuthenticationError('E-mail ou senha inválidos.'),
    ],
    [
      'AccessDeniedError',
      HttpStatus.FORBIDDEN,
      new AccessDeniedError(
        'Usuário com status BLOCKED não pode autenticar-se no sistema.',
      ),
    ],
  ])('deve traduzir %s para %i, mantendo a mensagem', (_, status, error) => {
    filter.catch(error, mockHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      mockResponse,
      expect.objectContaining({ statusCode: status, message: error.message }),
      status,
    );
  });

  it('deve funcionar com fallback caso httpAdapterHost não seja fornecido', () => {
    const filterWithoutAdapter = new DomainExceptionFilter();
    const error = new ResourceNotFoundError('Carga Química', 'id-123');

    filterWithoutAdapter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND }),
    );
  });

  it('retorna 400 para uma regra de negócio também sem httpAdapterHost', () => {
    const error = new BusinessRuleError('Transição de status inválida.');
    new DomainExceptionFilter().catch(error, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      }),
    );
  });
});
