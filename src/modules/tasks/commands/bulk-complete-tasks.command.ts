export class BulkCompleteTasksCommand {
  constructor(
    public readonly taskIds: string[],
    public readonly currentUser: { id: string; role: string },
  ) {}
}
