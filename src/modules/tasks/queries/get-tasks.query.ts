import { TaskQueryDto } from '../dto/task-query.dto';
export class GetTasksQuery {
  constructor(
    public readonly dto: TaskQueryDto,
    public readonly currentUser?: { id: string; role: string },
  ) {}
}
