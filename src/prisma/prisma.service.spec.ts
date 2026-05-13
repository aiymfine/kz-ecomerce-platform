import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  describe('withTenant', () => {
    it('should pass the main client to the callback', async () => {
      const callback = jest.fn().mockResolvedValue('result');
      const result = await service.withTenant(1, callback);

      expect(callback).toHaveBeenCalledWith(service);
      expect(result).toBe('result');
    });

    it('should work with any storeId', async () => {
      const callback = jest.fn().mockResolvedValue('ok');
      
      await service.withTenant(1, callback);
      await service.withTenant(2, callback);
      await service.withTenant(999, callback);

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });
});
