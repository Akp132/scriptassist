import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TasksService } from '../tasks.service';
import { GetTasksQuery } from './get-tasks.query';

@QueryHandler(GetTasksQuery)
export class GetTasksHandler implements IQueryHandler<GetTasksQuery> {
  constructor(private readonly service: TasksService) {}
  execute({ dto, currentUser }: GetTasksQuery) {
    return this.service.findAllFiltered(dto, currentUser);
  }
}
