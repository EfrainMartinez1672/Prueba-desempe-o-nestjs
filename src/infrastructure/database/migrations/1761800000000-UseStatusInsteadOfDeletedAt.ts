import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseStatusInsteadOfDeletedAt1761800000000 implements MigrationInterface {
  name = 'UseStatusInsteadOfDeletedAt1761800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(`UPDATE "users" SET "status" = 'INACTIVE' WHERE "deleted_at" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_workshops_active_name"`);
    await queryRunner.query(`UPDATE "workshops" SET "status" = 'INACTIVE' WHERE "deleted_at" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "workshops" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workshops_active_name" ON "workshops" (LOWER("name")) WHERE "status" = 'ACTIVE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_workshops_active_name"`);
    await queryRunner.query(`ALTER TABLE "workshops" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`UPDATE "workshops" SET "deleted_at" = now() WHERE "status" = 'INACTIVE'`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workshops_active_name" ON "workshops" (LOWER("name")) WHERE "deleted_at" IS NULL AND "status" = 'ACTIVE'`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`UPDATE "users" SET "deleted_at" = now() WHERE "status" = 'INACTIVE'`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
