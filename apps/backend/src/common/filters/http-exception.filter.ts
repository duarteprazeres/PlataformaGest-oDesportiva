import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as Record<string, unknown>).message as string) || message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint violation';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      }
    }

    // Capture in Sentry for 500 errors or unexpected exceptions
    if (status >= 500) {
      const user = (request as unknown as RequestWithUser).user;
      Sentry.captureException(exception, {
        extra: {
          req: {
            method: request.method,
            url: request.url,
            body: request.body,
            query: request.query,
            params: request.params,
          },
        },
        user: user ? { id: user.id, email: user.email } : undefined,
      });
    }

    let errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    };

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        errorResponse = { ...errorResponse, ...res };
      }
    }

    response.status(status).json(errorResponse);
  }
}
