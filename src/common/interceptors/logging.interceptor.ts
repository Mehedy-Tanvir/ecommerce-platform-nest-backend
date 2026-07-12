import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse<Response>();
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} ${response.statusCode} ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const status = error.status ?? 500;
          this.logger.error(
            `${method} ${url} ${status} ${duration}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
