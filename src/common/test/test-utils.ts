import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

type PrismaMock = DeepMockProxy<PrismaClient>;

export function createMockPrisma(): PrismaMock {
  return mockDeep<PrismaClient>();
}

export function resetMockPrisma(prisma: PrismaMock): void {
  mockReset(prisma);
}

export async function createTestModule(options: {
  providers: any[];
  imports?: any[];
  controllers?: any[];
}) {
  const { Test } = await import('@nestjs/testing');
  const { PrismaService } = await import('src/prisma/prisma.service');

  const prisma = createMockPrisma();

  const module = await Test.createTestingModule({
    imports: options.imports ?? [],
    controllers: options.controllers ?? [],
    providers: [
      ...options.providers,
      {
        provide: PrismaService,
        useValue: prisma,
      },
    ],
  }).compile();

  return { module, prisma };
}
