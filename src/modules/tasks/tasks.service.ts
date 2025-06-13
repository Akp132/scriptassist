import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create(createTaskDto);
    const savedTask = await this.tasksRepository.save(task);

    this.taskQueue.add('task-status-update', {
      taskId: savedTask.id,
      status: savedTask.status,
    });

    return savedTask;
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Task> {
    const count = await this.tasksRepository.count({ where: { id } });

    if (count === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return (await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    })) as Task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, currentUser: any): Promise<Task> {
    const task = await this.findOne(id);
    if (task.user.id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to modify this task.');
    }
    const originalStatus = task.status;
    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description) task.description = updateTaskDto.description;
    if (updateTaskDto.status) task.status = updateTaskDto.status;
    if (updateTaskDto.priority) task.priority = updateTaskDto.priority;
    if (updateTaskDto.dueDate) task.dueDate = new Date(updateTaskDto.dueDate);
    const updatedTask = await this.tasksRepository.save(task);
    if (originalStatus !== updatedTask.status) {
      this.taskQueue.add('task-status-update', {
        taskId: updatedTask.id,
        status: updatedTask.status,
      });
    }
    return updatedTask;
  }

  async remove(id: string, currentUser: any): Promise<void> {
    const task = await this.findOne(id);
    if (task.user.id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to delete this task.');
    }
    await this.tasksRepository.remove(task);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const query = 'SELECT * FROM tasks WHERE status = $1';
    return this.tasksRepository.query(query, [status]);
  }

  async updateStatus(id: string, status: string): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status as any;
    return this.tasksRepository.save(task);
  }

  /**
   * Find all tasks with optional filters and pagination, eliminating N+1 queries.
   * @param status Optional TaskStatus filter
   * @param priority Optional TaskPriority filter
   * @param page Page number (default 1)
   * @param limit Page size (default 10)
   * @returns { items: Task[], total: number }
   */
  async findAllFiltered(options?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    page?: number;
    limit?: number;
  }): Promise<{ items: Task[]; total: number }> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 10;
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .orderBy('task.createdAt', 'DESC');

    if (options?.status) {
      query.andWhere('task.status = :status', { status: options.status });
    }
    if (options?.priority) {
      query.andWhere('task.priority = :priority', { priority: options.priority });
    }

    query.skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }
}
