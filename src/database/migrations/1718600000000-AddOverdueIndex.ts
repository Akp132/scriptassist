import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOverdueIndex1718600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_task_overdue" ON "tasks" ("user_id", "due_date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_task_overdue";
    `);
  }
}
