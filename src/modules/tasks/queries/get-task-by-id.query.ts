export class GetTaskByIdQuery {
  constructor(
    public readonly id: string,
    public readonly currentUser?: { id: string; role: string },
  ) {}
}
