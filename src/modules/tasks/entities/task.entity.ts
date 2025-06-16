import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

@Index('IDX_task_user_status', ['userId', 'status'])
@Index('IDX_task_due_date', ['dueDate'])
@Index('IDX_task_created_updated', ['createdAt', 'updatedAt'])
@Index('IDX_task_overdue', ['userId', 'dueDate'])
@Index('IDX_task_user_due_date', ['userId', 'dueDate'])
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ name: 'user_id' })
  userId: string;

  // Avoid circular import by using a string for the relation target
  @ManyToOne('User', 'tasks', { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}