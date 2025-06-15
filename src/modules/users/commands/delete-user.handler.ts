import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { DeleteUserCommand } from './delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async execute({ id }: DeleteUserCommand) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.repo.delete(id);
    return { id };
  }
}
