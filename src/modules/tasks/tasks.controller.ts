import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpException, HttpStatus, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { instanceToPlain } from 'class-transformer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskQueryDto } from './dto/task-query.dto';

// This guard needs to be implemented or imported from the correct location
// We're intentionally leaving it as a non-working placeholder
class JwtAuthGuard {}

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ limit: 100, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all tasks with optional filtering' })
  @ApiQuery({ type: TaskQueryDto })
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: TaskQueryDto,
  ) {
    const { items, total, page, limit } = await this.tasksService.findAllFiltered(query);
    return {
      data: instanceToPlain(items),
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
  async findOne(@Param('id') id: string) {
    const task = await this.tasksService.findOne(id);
    if (!task) {
      throw new HttpException(`Task with ID ${id} not found in the database`, HttpStatus.NOT_FOUND);
    }
    return instanceToPlain(task);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.tasksService.remove(id, currentUser);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  async batchProcess(
    @Body() operations: { tasks: string[], action: string },
    @CurrentUser() currentUser: any,
  ) {
    const { tasks: taskIds, action } = operations;
    const results = [];
    for (const taskId of taskIds) {
      try {
        let result;
        switch (action) {
          case 'complete':
            result = await this.tasksService.update(taskId, { status: TaskStatus.COMPLETED }, currentUser);
            result = instanceToPlain(result);
            break;
          case 'delete':
            result = await this.tasksService.remove(taskId, currentUser);
            break;
          default:
            throw new HttpException(`Unknown action: ${action}`, HttpStatus.BAD_REQUEST);
        }
        results.push({ taskId, success: true, result });
      } catch (error) {
        results.push({ 
          taskId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    return results;
  }
}