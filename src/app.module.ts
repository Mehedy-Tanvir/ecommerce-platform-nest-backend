import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrpcModule } from './trpc/trpc.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

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
      useFactory: async (configService: ConfigService) => ({
        stores: [
          await redisStore({
            socket: {
              host: configService.get('REDIS_HOST', 'localhost'),
              port: +configService.get('REDIS_PORT', 6379),
            },
          }),
        ],
        ttl: +configService.get('REDIS_TTL', 60),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    TrpcModule,
    AuthModule,
    UsersModule,
    CategoryModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
