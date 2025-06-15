export class MarkTaskIncompleteCommand {
  constructor(
    public readonly id: string,
    public readonly currentUser: { id: string; role: string },
  ) {}
}
