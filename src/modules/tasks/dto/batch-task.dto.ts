import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { BatchAction } from './batch-action.enum';

export class BatchTaskDto {
  @IsArray()
  @ArrayNotEmpty()
  taskIds: string[];

  @IsEnum(BatchAction)
  action: BatchAction;
}
