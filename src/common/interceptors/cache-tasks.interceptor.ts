import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheTasksInterceptor implements NestInterceptor {
  private readonly ttl: number;
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.ttl = Number(this.configService.get('TASKS_CACHE_TTL')) || 30;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    if (req.method !== 'GET' || !req.path.endsWith('/tasks')) {
      return next.handle();
    }
    const userId = req.user?.id || 'anon';
    const cacheKey = `tasks:${userId}:${req.originalUrl}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return of(cached);
    }
    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheManager.set(cacheKey, result, this.ttl);
      }),
    );
  }
}
