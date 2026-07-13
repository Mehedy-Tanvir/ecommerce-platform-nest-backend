import { Injectable } from '@nestjs/common';
import { TRPCAdapter } from './trpc.adapter';

@Injectable()
export class TRPCRouter {
  constructor(private readonly trpcAdapter: TRPCAdapter) {}

  get t() {
    return this.trpcAdapter.t;
  }
}
