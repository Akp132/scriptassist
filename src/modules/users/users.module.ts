import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin.controller';
import { User } from './entities/user.entity';
import { GetAllUsersHandler } from './queries/get-all-users.handler';
import { DisableUserHandler } from './commands/disable-user.handler';
import { DeleteUserHandler } from './commands/delete-user.handler';

const CommandHandlers = [DisableUserHandler, DeleteUserHandler];
const QueryHandlers = [GetAllUsersHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CqrsModule,
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, ...CommandHandlers, ...QueryHandlers],
  exports: [UsersService],
})
export class UsersModule {}