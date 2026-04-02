import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;

        if (Array.isArray(res.message)) {
          message = 'Validation failed';
          errors = res.message;
        } else {
          message = res.message || message;
        }
      }
    }

    else if ((exception as any)?.code === 'ER_DUP_ENTRY') {
      status = HttpStatus.CONFLICT;
      message = 'Duplicate entry — record already exists';
    }

    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      errors,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        JSON.stringify(errorResponse),
      );
    }

    response.status(status).json(errorResponse);
  }
}