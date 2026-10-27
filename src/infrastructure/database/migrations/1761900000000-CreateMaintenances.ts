import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaintenances1761900000000 implements MigrationInterface {
  name = 'CreateMaintenances1761900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."maintenances_type_enum" AS ENUM('PREVENTIVE', 'CORRECTIVE')`);
    await queryRunner.query(
      `CREATE TYPE "public"."maintenances_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "maintenances" (
        "id" SERIAL NOT NULL,
        "type" "public"."maintenances_type_enum" NOT NULL,
        "description" text NOT NULL,
        "mileage" integer NOT NULL,
        "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."maintenances_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "work_performed" text,
        "final_cost" numeric(12,2),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "final_mileage" integer,
        "vehicle_id" integer NOT NULL,
        "mechanic_id" integer NOT NULL,
        "workshop_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenances_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_maintenances_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_maintenances_mechanic" FOREIGN KEY ("mechanic_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_maintenances_workshop" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_maintenances_mileage_nonnegative" CHECK ("mileage" >= 0),
        CONSTRAINT "CHK_maintenances_final_mileage_nonnegative" CHECK ("final_mileage" IS NULL OR "final_mileage" >= 0),
        CONSTRAINT "CHK_maintenances_final_cost_nonnegative" CHECK ("final_cost" IS NULL OR "final_cost" >= 0),
        CONSTRAINT "CHK_maintenances_completion_fields" CHECK (
          ("status" = 'COMPLETED' AND "work_performed" IS NOT NULL AND "final_cost" IS NOT NULL AND "completed_at" IS NOT NULL AND "final_mileage" IS NOT NULL)
          OR
          ("status" <> 'COMPLETED' AND "work_performed" IS NULL AND "final_cost" IS NULL AND "completed_at" IS NULL AND "final_mileage" IS NULL)
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_maintenances_vehicle_scheduled" ON "maintenances" ("vehicle_id", "scheduled_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_maintenances_mechanic_scheduled" ON "maintenances" ("mechanic_id", "scheduled_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_maintenances_status_scheduled" ON "maintenances" ("status", "scheduled_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_maintenances_status_scheduled"');
    await queryRunner.query('DROP INDEX "IDX_maintenances_mechanic_scheduled"');
    await queryRunner.query('DROP INDEX "IDX_maintenances_vehicle_scheduled"');
    await queryRunner.query('DROP TABLE "maintenances"');
    await queryRunner.query('DROP TYPE "public"."maintenances_status_enum"');
    await queryRunner.query('DROP TYPE "public"."maintenances_type_enum"');
  }
}
