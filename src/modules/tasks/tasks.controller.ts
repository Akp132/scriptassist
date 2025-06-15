import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { instanceToPlain } from 'class-transformer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard, RateLimitGuard)
@RateLimit({ limit: 100, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tasksService: TasksService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.commandBus.execute(
      new (await import('./commands/create-task.command')).CreateTaskCommand(createTaskDto)
    );
    return instanceToPlain(task);
  }

  @Get()
  @ApiOperation({ summary: 'Find all tasks with optional filtering' })
  @ApiQuery({ type: TaskQueryDto })
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: TaskQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    const { data, total, page, limit } = await this.queryBus.execute(
      new (await import('./queries/get-tasks.query')).GetTasksQuery(query, currentUser)
    );
    return {
      data: instanceToPlain(data),
      total,
      page,
      limit,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats() {
    // Remove direct repository usage; implement stats in service if needed
    throw new Error('Not implemented: Use a service method for stats.');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a task by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.queryBus.execute(new (await import('./queries/get-task-by-id.query')).GetTaskByIdQuery(id, user));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a task' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.commandBus.execute(
      new (await import('./commands/update-task.command')).UpdateTaskCommand(id, updateTaskDto, currentUser)
    );
  }

  @Patch(':id/incomplete')
  @ApiOperation({ summary: 'Mark a task as incomplete' })
  async markIncomplete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commandBus.execute(new (await import('./commands/mark-task-incomplete.command')).MarkTaskIncompleteCommand(id, user));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a task' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.commandBus.execute(
      new (await import('./commands/delete-task.command')).DeleteTaskCommand(id, currentUser)
    );
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  @ApiBody({ schema: { properties: { tasks: { type: 'array', items: { type: 'string' } }, action: { type: 'string', enum: ['complete', 'delete'] } } } })
  async batchProcess(
    @Body() operations: { tasks: string[], action: 'complete' | 'delete' },
    @CurrentUser() currentUser: any,
  ) {
    const { tasks, action } = operations;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      throw new HttpException('No task IDs provided', HttpStatus.BAD_REQUEST);
    }
    if (action === 'complete') {
      const updated = await this.commandBus.execute(
        new (await import('./commands/bulk-complete-tasks.command')).BulkCompleteTasksCommand(tasks, currentUser)
      );
      return { updated };
    } else if (action === 'delete') {
      // Retain legacy service for delete (no CQRS event/command for delete yet)
      const result = await this.tasksService.bulkDelete(tasks, currentUser);
      return result;
    } else {
      throw new HttpException(`Unknown action: ${action}`, HttpStatus.BAD_REQUEST);
    }
  }
}