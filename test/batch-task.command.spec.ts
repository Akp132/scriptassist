import { BatchUpdateTasksCommand } from '../src/modules/tasks/commands/batch-update-tasks.command';
import { BatchAction } from '../src/modules/tasks/dto/batch-action.enum';

describe('BatchUpdateTasksCommand', () => {
  it('should create a command with correct properties', () => {
    const taskIds = ['1', '2'];
    const action = BatchAction.MARK_COMPLETE;
    const currentUser = { id: 'user1', role: 'admin' };
    const cmd = new BatchUpdateTasksCommand(taskIds, action, currentUser);
    expect(cmd.taskIds).toBe(taskIds);
    expect(cmd.action).toBe(action);
    expect(cmd.currentUser).toBe(currentUser);
  });
});
