import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaintenanceScheduledEndAndMechanicExclusion1762000000000 implements MigrationInterface {
  name = 'AddMaintenanceScheduledEndAndMechanicExclusion1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "maintenances" ADD COLUMN "scheduled_end_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(
      `UPDATE "maintenances" SET "scheduled_end_at" = "scheduled_at" + INTERVAL '1 hour' WHERE "scheduled_end_at" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "maintenances" ALTER COLUMN "scheduled_end_at" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "maintenances" ADD CONSTRAINT "CHK_maintenances_schedule_window" CHECK ("scheduled_end_at" > "scheduled_at")`,
    );

    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
    await queryRunner.query(`
      ALTER TABLE "maintenances"
      ADD CONSTRAINT "EXCL_maintenances_mechanic_schedule"
      EXCLUDE USING gist (
        "mechanic_id" WITH =,
        tstzrange("scheduled_at", "scheduled_end_at", '[)') WITH &&
      )
      WHERE ("status" IN ('SCHEDULED', 'IN_PROGRESS'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "maintenances" DROP CONSTRAINT "EXCL_maintenances_mechanic_schedule"');
    await queryRunner.query('ALTER TABLE "maintenances" DROP CONSTRAINT "CHK_maintenances_schedule_window"');
    await queryRunner.query('ALTER TABLE "maintenances" DROP COLUMN "scheduled_end_at"');
  }
}
