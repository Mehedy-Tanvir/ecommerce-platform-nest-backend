import { Injectable } from '@nestjs/common';
import { TRPCAdapter } from './trpc.adapter';
import { ProductsRouter } from './routers/products.router';
import { CategoriesRouter } from './routers/categories.router';
import { AuthRouter } from './routers/auth.router';
import { OrdersRouter } from './routers/orders.router';
import { UsersRouter } from './routers/users.router';

@Injectable()
export class TRPCRouter {
  constructor(
    private adapter: TRPCAdapter,
    private productsRouter: ProductsRouter,
    private categoriesRouter: CategoriesRouter,
    private authRouter: AuthRouter,
    private ordersRouter: OrdersRouter,
    private usersRouter: UsersRouter,
  ) {}

  get appRouter() {
    return this.adapter.t.router({
      products: this.productsRouter.router,
      categories: this.categoriesRouter.router,
      auth: this.authRouter.router,
      orders: this.ordersRouter.router,
      users: this.usersRouter.router,
    });
  }
}

export type AppRouter = TRPCRouter['appRouter'];
