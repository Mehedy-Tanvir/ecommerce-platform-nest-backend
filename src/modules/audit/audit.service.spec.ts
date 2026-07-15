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

    describe('findAll', () => {
      beforeEach(() => {
        prisma.$transaction.mockImplementation((ops: any[]) =>
          Promise.all(ops),
        );
      });

      it('should return paginated results ordered by createdAt desc', async () => {
        const logs = [
          { id: 'log-1', createdAt: new Date('2024-01-02') },
          { id: 'log-2', createdAt: new Date('2024-01-01') },
        ];
        prisma.auditLog.findMany.mockResolvedValue(logs as any);
        prisma.auditLog.count.mockResolvedValue(2);

        const result = await service.findAll({ page: 1, limit: 20 });

        expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
          where: {},
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        });
        expect(result.total).toBe(2);
        expect(result.totalPages).toBe(1);
        expect(result.data).toEqual(logs);
      });

      it('should apply filters and pagination', async () => {
        prisma.auditLog.findMany.mockResolvedValue([]);
        prisma.auditLog.count.mockResolvedValue(0);

        await service.findAll({
          page: 2,
          limit: 10,
          action: 'ORDER_CREATED',
          entity: 'order',
          userId: 'user-1',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });

        const findManyArg = prisma.auditLog.findMany.mock.calls[0][0];
        expect(findManyArg.where).toEqual({
          action: 'ORDER_CREATED',
          entity: 'order',
          userId: 'user-1',
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        });
        expect(findManyArg.skip).toBe(10);
        expect(findManyArg.take).toBe(10);
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
