import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskIndexes1718479200000 implements MigrationInterface {
  name = 'AddTaskIndexes1718479200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_task_user_status" ON "tasks" ("user_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_due_date" ON "tasks" ("due_date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_due_date"`);
  }
}
