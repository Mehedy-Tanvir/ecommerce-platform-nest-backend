import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should call prisma.auditLog.create with correct data', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.log({
        action: 'USER_LOGIN',
        entity: 'user',
        entityId: 'user-1',
        userId: 'user-1',
        ipAddress: '127.0.0.1',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'USER_LOGIN',
          entity: 'user',
          entityId: 'user-1',
          userId: 'user-1',
          metadata: undefined,
          ipAddress: '127.0.0.1',
        },
      });
    });

    it('should handle missing optional fields', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.log({
        action: 'PRODUCT_UPDATED',
        entity: 'product',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PRODUCT_UPDATED',
          entity: 'product',
          entityId: undefined,
          userId: undefined,
          metadata: undefined,
          ipAddress: undefined,
        },
      });
    });

    it('should work with metadata', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);
      const metadata = { amount: 100, currency: 'USD' };

      await service.log({
        action: 'PAYMENT_CREATED',
        entity: 'payment',
        entityId: 'pay-1',
        metadata,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PAYMENT_CREATED',
          entity: 'payment',
          entityId: 'pay-1',
          userId: undefined,
          metadata,
          ipAddress: undefined,
        },
      });
    });
  });
});
