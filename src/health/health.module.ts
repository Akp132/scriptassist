import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';

import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule,
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`,
    }),
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
