import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DisableUserHandler } from '../src/modules/users/commands/disable-user.handler';
import { DisableUserCommand } from '../src/modules/users/commands/disable-user.command';
import { User } from '../src/modules/users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('DisableUserHandler', () => {
  let handler: DisableUserHandler;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        DisableUserHandler,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();
    handler = module.get(DisableUserHandler);
  });

  it('should disable a user if found', async () => {
    const user = { id: 'u1', isActive: true, password: 'secret' };
    repo.findOne.mockResolvedValue(user);
    repo.save.mockImplementation(async (u: any) => ({ ...u, password: undefined }));
    const command = new DisableUserCommand('u1');
    const result = await handler.execute(command);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(repo.save).toHaveBeenCalledWith({ ...user, isActive: false });
    expect(result.isActive).toBe(false);
  });

  it('should throw NotFoundException if user not found', async () => {
    repo.findOne.mockResolvedValue(undefined);
    const command = new DisableUserCommand('u2');
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
