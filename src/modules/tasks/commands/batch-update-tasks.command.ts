import { BatchAction } from '../dto/batch-action.enum';

export class BatchUpdateTasksCommand {
  constructor(
    public readonly taskIds: string[],
    public readonly action: BatchAction,
    public readonly currentUser: { id: string; role: string },
  ) {}
}
