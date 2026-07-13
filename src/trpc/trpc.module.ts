import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TRPCAdapter } from './trpc.adapter';
import { TRPCRouter } from './trpc.router';
import { ProductsRouter } from './routers/products.router';
import { CategoriesRouter } from './routers/categories.router';
import { AuthRouter } from './routers/auth.router';
import { OrdersRouter } from './routers/orders.router';
import { UsersRouter } from './routers/users.router';

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
  providers: [
    TRPCAdapter,
    TRPCRouter,
    ProductsRouter,
    CategoriesRouter,
    AuthRouter,
    OrdersRouter,
    UsersRouter,
  ],
  exports: [
    TRPCAdapter,
    TRPCRouter,
    ProductsRouter,
    CategoriesRouter,
    AuthRouter,
    OrdersRouter,
    UsersRouter,
  ],
})
export class TrpcModule {}
