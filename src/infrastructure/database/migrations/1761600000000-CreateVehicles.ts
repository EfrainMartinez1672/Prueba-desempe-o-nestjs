import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicles1761600000000 implements MigrationInterface {
  name = 'CreateVehicles1761600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."vehicles_status_enum" AS ENUM('AVAILABLE', 'IN_MAINTENANCE', 'INACTIVE')`,
    );
    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" SERIAL NOT NULL,
        "plate" character varying(15) NOT NULL,
        "make" character varying(80) NOT NULL,
        "model" character varying(100) NOT NULL,
        "year" smallint NOT NULL,
        "mileage" integer NOT NULL,
        "status" "public"."vehicles_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_vehicles_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_vehicles_active_plate" ON "vehicles" ("plate") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "UQ_vehicles_active_plate"');
    await queryRunner.query('DROP TABLE "vehicles"');
    await queryRunner.query('DROP TYPE "public"."vehicles_status_enum"');
  }
}
