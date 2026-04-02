import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - start;

        const statusIcon =
          statusCode >= 500 ? '🔴' :
          statusCode >= 400 ? '🟡' :
          statusCode >= 300 ? '🔵' : '🟢';

        this.logger.log(
          `${statusIcon} ${method} ${url} → ${statusCode} (${duration}ms)`,
        );
      }),
    );
  }
}