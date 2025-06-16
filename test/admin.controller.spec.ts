import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from '../src/modules/users/admin.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let queryBus: QueryBus;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        { provide: QueryBus, useValue: { execute: jest.fn() } },
        { provide: CommandBus, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    queryBus = module.get<QueryBus>(QueryBus);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call queryBus.execute on getAll', async () => {
    const executeSpy = jest.spyOn(queryBus, 'execute').mockResolvedValue('result');
    const result = await controller.getAll(2, 5);
    expect(executeSpy).toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('should call commandBus.execute on disable', async () => {
    const executeSpy = jest.spyOn(commandBus, 'execute').mockResolvedValue('disabled');
    const result = await controller.disable('user-id');
    expect(executeSpy).toHaveBeenCalled();
    expect(result).toBe('disabled');
  });

  it('should call commandBus.execute on delete', async () => {
    const executeSpy = jest.spyOn(commandBus, 'execute').mockResolvedValue('deleted');
    const result = await controller.delete('user-id');
    expect(executeSpy).toHaveBeenCalled();
    expect(result).toBe('deleted');
  });
});
