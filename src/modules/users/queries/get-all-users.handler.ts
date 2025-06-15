import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { GetAllUsersQuery } from './get-all-users.query';

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery> {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async execute(query: GetAllUsersQuery) {
    const { page, limit } = query;
    const [users, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });
    return {
      data: users,
      total,
      page,
      limit,
    };
  }
}
