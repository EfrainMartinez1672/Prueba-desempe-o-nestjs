import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndTechnicianProfiles1761500000000 implements MigrationInterface {
  name = 'CreateUsersAndTechnicianProfiles1761500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TYPE "public"."users_role_enum" AS ENUM(\'ADMIN\', \'TECHNICIAN\')');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(120) NOT NULL,
        "email" character varying(254) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'TECHNICIAN',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "technician_profiles" (
        "id" SERIAL NOT NULL,
        "specialty" character varying(120) NOT NULL,
        "user_id" integer NOT NULL,
        CONSTRAINT "PK_technician_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_technician_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_technician_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "technician_profiles"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TYPE "public"."users_role_enum"');
  }
}
