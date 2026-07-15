import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrpcModule } from './trpc/trpc.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import Keyv from 'keyv';
import { CacheServiceModule } from './modules/cache/cache.module';
import { EventBusModule } from './modules/event-bus/event-bus.module';
import { BullModule } from '@nestjs/bull';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const redisAdapter = (await redisStore({
          socket: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: +configService.get('REDIS_PORT', 6379),
          },
        })) as any;

        // redis-yet exposes `del`/`reset`; Keyv (used by @nestjs/cache-manager)
        // requires `delete`/`clear`, so wrap the adapter in a Keyv with aliases.
        const keyvStore = new Keyv({
          store: {
            ...redisAdapter,
            delete: redisAdapter.del,
            clear: redisAdapter.reset,
          },
          ttl: +configService.get('REDIS_TTL', 60),
        });

        return {
          stores: [keyvStore],
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    CacheServiceModule,
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    EventBusModule,
    TrpcModule,
    AuthModule,
    UsersModule,
    CategoryModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
