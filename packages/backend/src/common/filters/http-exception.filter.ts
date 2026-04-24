import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { GqlContextType } from '@nestjs/graphql';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // GraphQL context: re-throw so NestJS GraphQL's built-in error handler formats it
    if (host.getType<GqlContextType>() === 'graphql') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log the actual error for debugging
    if (!(exception instanceof HttpException)) {
      console.error('[GlobalExceptionFilter] Unhandled exception:', exception);
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'object' && exResponse !== null) {
        const res = exResponse as Record<string, unknown>;
        message = (res.message as string) || exception.message;
        code = (res.error as string) || 'HTTP_ERROR';
      } else {
        message = exResponse as string;
      }
    }

    response.status(status).json({
      error: {
        code,
        message,
        statusCode: status,
      },
    });
  }
}
