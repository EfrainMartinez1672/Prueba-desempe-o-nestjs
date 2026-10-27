import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get<string>('REDIS_PASSWORD') || undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    return ttlSeconds ? this.client.set(key, value, 'EX', ttlSeconds) : this.client.set(key, value);
  }

  delete(key: string): Promise<number> {
    return this.client.del(key);
  }

  async rotateValue(key: string, expected: string, replacement: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.eval(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3]) else return 0 end",
      1,
      key,
      expected,
      replacement,
      ttlSeconds,
    );
    return result === 'OK';
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
