import {
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const url = configService.get<string>('REDIS_URL')?.trim();
        if (!url) {
          throw new Error(
            'REDIS_URL is not set. Paste your Upstash / Redis Cloud connection string into backend/.env',
          );
        }
        if (!url.startsWith('rediss://') && !url.startsWith('redis://')) {
          throw new Error('REDIS_URL must start with rediss:// or redis://');
        }

        const logger = new Logger('Redis');

        // rediss:// turns TLS on by itself — no tls option needed here, and
        // never rejectUnauthorized: false.
        return new Redis(url, {
          connectTimeout: 10_000,
          keepAlive: 30_000, // stops managed providers reaping idle connections
          maxRetriesPerRequest: 3, // fail fast; null would queue forever
          enableOfflineQueue: true,
          retryStrategy: (times) => Math.min(times * 200, 5_000),
        })
          .on('connect', () => logger.log('connected'))
          .on('error', (e: Error) => logger.error(`redis error: ${e.message}`));
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleInit() {
    this.logger.log(`PING -> ${await this.client.ping()}`);
  }

  async onApplicationShutdown() {
    await this.client.quit();
  }
}
