import { jest } from '@jest/globals';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.ts';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.ts';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockHttpAdapter: { reply: jest.Mock };
  let mockHost: ArgumentsHost;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    mockHttpAdapter = { reply: jest.fn() };
    const httpAdapterHost = { httpAdapter: mockHttpAdapter } as unknown as HttpAdapterHost;
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

  it('deve funcionar com fallback caso httpAdapterHost não seja fornecido', () => {
    const filterWithoutAdapter = new DomainExceptionFilter();
    const error = new ResourceNotFoundError('Carga Química', 'id-123');

    filterWithoutAdapter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND }),
    );
  });
});
