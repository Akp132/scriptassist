import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskCompletedEvent } from './task-completed.event';

@EventsHandler(TaskCompletedEvent)
export class TaskCompletedHandler implements IEventHandler<TaskCompletedEvent> {
  constructor(@InjectQueue('task-processing') private queue: Queue) {}

  handle(event: TaskCompletedEvent) {
    return this.queue.add('task-status-update', {
      taskId: event.taskId,
      status: 'COMPLETED',
    });
  }
}
