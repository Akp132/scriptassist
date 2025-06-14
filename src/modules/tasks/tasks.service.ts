import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { TaskQueryDto } from './dto/task-query.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    private dataSource: DataSource,
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
    // Debug: Log currentUser and task
    console.log('DEBUG update: currentUser', currentUser);
    console.log('DEBUG update: task', task);
    if (!currentUser) {
      throw new ForbiddenException('Unauthenticated');
    }
    // Only owner or admin can update
    if (task.userId !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException(
        `Not authorized to modify this task. task.userId=${task.userId}, currentUser.id=${currentUser.id}, currentUser.role=${currentUser.role}`
      );
    }
    // Only allow status update
    if (updateTaskDto.status) {
      task.status = updateTaskDto.status;
    } else {
      throw new ForbiddenException('Only status update is allowed');
    }
    const updatedTask = await this.tasksRepository.save(task);
    this.taskQueue.add('task-status-update', {
      taskId: updatedTask.id,
      status: updatedTask.status,
    });
    return updatedTask;
  }

  async remove(id: string, currentUser: any): Promise<void> {
    const task = await this.findOne(id);
    // Debug: Log currentUser and task
    console.log('DEBUG remove: currentUser', currentUser);
    console.log('DEBUG remove: task', task);
    if (!currentUser) {
      throw new ForbiddenException('Unauthenticated');
    }
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Not authorized to delete this task. Only admin allowed.');
    }
    await this.tasksRepository.delete(id);
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
   * @param queryDto TaskQueryDto with filters and pagination
   * @returns { items: Task[], total: number }
   */
  async findAllFiltered(queryDto: TaskQueryDto, currentUser?: any): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    const { status, priority, search, page = 1, limit = 10, userId } = queryDto;
    const qb = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .addSelect('COUNT(*) OVER() as "totalCount"');

    // Only non-admins can see their own tasks
    if (currentUser && currentUser.role !== 'admin') {
      qb.andWhere('task.userId = :userId', { userId: currentUser.id });
    } else if (userId) {
      qb.andWhere('task.userId = :userId', { userId });
    }
    if (status) {
      qb.andWhere('task.status = :status', { status });
    }
    if (priority) {
      qb.andWhere('task.priority = :priority', { priority });
    }
    if (search) {
      qb.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', { search: `%${search}%` });
    }

    const { raw, entities } = await qb.getRawAndEntities();
    const total = raw.length > 0 ? parseInt(raw[0].totalCount, 10) : 0;
    return {
      data: entities,
      total,
      page,
      limit,
    };
  }
}
