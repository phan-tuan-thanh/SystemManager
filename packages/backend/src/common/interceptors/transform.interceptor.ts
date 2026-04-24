import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  data: T;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // GraphQL responses must not be wrapped — Apollo handles formatting
    if (context.getType() !== 'http') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'meta' in data) {
          return {
            data: data.data,
            message: 'OK',
            meta: data.meta,
          };
        }
        return {
          data,
          message: 'OK',
        };
      }),
    );
  }
}
