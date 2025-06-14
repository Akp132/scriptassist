import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class TaskQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by status' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Filter by priority' })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Filter by userId (admin only)' })
  @IsString()
  @IsOptional()
  userId?: string;
}
