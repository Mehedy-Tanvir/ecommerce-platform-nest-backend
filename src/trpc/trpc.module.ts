import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TRPCAdapter } from './trpc.adapter';
import { TRPCRouter } from './trpc.router';
import { OrdersRouter } from './routers/orders.router';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') ?? 'default_secret_key_2026',
      }),
    }),
  ],
  providers: [TRPCAdapter, TRPCRouter, OrdersRouter],
  exports: [TRPCAdapter, TRPCRouter, OrdersRouter],
})
export class TrpcModule {}
