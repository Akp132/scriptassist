import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          transport: config.get('NODE_ENV') === 'development' ? {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: true, singleLine: false },
          } : undefined,
          genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
          customProps: (req) => {
            const user = (req as any).user;
            return {
              requestId: req.id || req.headers['x-request-id'],
              userId: user?.id || null,
            };
          },
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
