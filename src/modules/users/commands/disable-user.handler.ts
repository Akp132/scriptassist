import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { DisableUserCommand } from './disable-user.command';

@CommandHandler(DisableUserCommand)
export class DisableUserHandler implements ICommandHandler<DisableUserCommand> {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async execute({ id }: DisableUserCommand) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    await this.repo.save(user);
    return { id: user.id, isActive: user.isActive };
  }
}
