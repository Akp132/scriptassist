import { TransactionService } from '../src/common/services/transaction.service';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

describe('TransactionService', () => {
  let service: TransactionService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let manager: EntityManager;

  beforeEach(() => {
    manager = {} as EntityManager;
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager,
    } as any;
    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as any;
    service = new TransactionService(dataSource);
  });

  it('should run callback and commit transaction', async () => {
    const cb = jest.fn().mockResolvedValue('ok');
    const result = await service.runInTransaction(cb);
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith(manager);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(result).toBe('ok');
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('should rollback on error and throw', async () => {
    const cb = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(service.runInTransaction(cb)).rejects.toThrow('fail');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
