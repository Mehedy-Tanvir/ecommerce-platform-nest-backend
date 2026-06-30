import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    // Create pg Pool as local variable so we can pass it to super()
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      allowExitOnIdle: true,
      idleTimeoutMillis: 500,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    this.pool = pool;
  }
  async onModuleInit() {
    await this.$connect();
    console.log('Connected to the database');
  }
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Disconnected from the database');
  }
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cleaning the database is not allowed in production');
    }
    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_'),
    );
    return Promise.all(
      models.map((modelKey) => {
        if (typeof modelKey === 'string') {
          return this[modelKey].deleteMany();
        }
      }),
    );
  }
}
