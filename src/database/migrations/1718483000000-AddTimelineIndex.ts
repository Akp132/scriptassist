import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimelineIndex1718483000000 implements MigrationInterface {
  name = 'AddTimelineIndex1718483000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_task_created_updated" ON "tasks" ("created_at", "updated_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_created_updated"`);
  }
}
