import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { CreateTaskHandler } from './commands/create-task.handler';
import { BulkCompleteTasksHandler } from './commands/bulk-complete-tasks.handler';
import { GetTasksHandler } from './queries/get-tasks.handler';
import { TaskCompletedHandler } from './events/task-completed.handler';
import { UpdateTaskHandler } from './commands/update-task.handler';
import { DeleteTaskHandler } from './commands/delete-task.handler';
import { GetTaskByIdHandler } from './queries/get-task-by-id.handler';
import { MarkTaskIncompleteHandler } from './commands/mark-task-incomplete.handler';
import { BatchUpdateTasksHandler } from './commands/batch-update-tasks.handler';

const CommandHandlers = [
  CreateTaskHandler,
  BulkCompleteTasksHandler,
  UpdateTaskHandler,
  DeleteTaskHandler,
  MarkTaskIncompleteHandler,
  BatchUpdateTasksHandler,
];
const QueryHandlers = [GetTasksHandler, GetTaskByIdHandler];
const EventHandlers = [TaskCompletedHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Task]),
    BullModule.registerQueue({
      name: 'task-processing',
    }),
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [TasksService],
})
export class TasksModule {}