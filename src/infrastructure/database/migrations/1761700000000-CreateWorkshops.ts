import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkshops1761700000000 implements MigrationInterface {
  name = 'CreateWorkshops1761700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."workshops_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(`
      CREATE TABLE "workshops" (
        "id" SERIAL NOT NULL,
        "name" character varying(120) NOT NULL,
        "address" character varying(300) NOT NULL,
        "status" "public"."workshops_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_workshops_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workshops_active_name" ON "workshops" (LOWER("name")) WHERE "status" = 'ACTIVE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "UQ_workshops_active_name"');
    await queryRunner.query('DROP TABLE "workshops"');
    await queryRunner.query('DROP TYPE "public"."workshops_status_enum"');
  }
}
