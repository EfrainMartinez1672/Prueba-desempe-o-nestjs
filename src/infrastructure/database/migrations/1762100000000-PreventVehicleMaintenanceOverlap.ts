import { MigrationInterface, QueryRunner } from 'typeorm';

export class PreventVehicleMaintenanceOverlap1762100000000 implements MigrationInterface {
  name = 'PreventVehicleMaintenanceOverlap1762100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "maintenances"
      ADD CONSTRAINT "EXCL_maintenances_vehicle_schedule"
      EXCLUDE USING gist (
        "vehicle_id" WITH =,
        tstzrange("scheduled_at", "scheduled_end_at", '[)') WITH &&
      )
      WHERE ("status" IN ('SCHEDULED', 'IN_PROGRESS'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "maintenances" DROP CONSTRAINT "EXCL_maintenances_vehicle_schedule"');
  }
}
