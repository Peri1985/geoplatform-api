import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersAndRefreshTokens1792060988081 implements MigrationInterface {
  name = 'AddUsersAndRefreshTokens1792060988081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying(254) NOT NULL, "passwordHash" character varying(255) NOT NULL, "role" "public"."user_role" NOT NULL DEFAULT 'user', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c25bc63d248ca90e8dcc1d92d06" UNIQUE ("tokenHash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens"  ("userId") `,
    );
    await queryRunner.query(`ALTER TABLE "places" ADD "createdById" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a675f4d5aab30da0df6f7ee234" ON "places"  ("createdById") `,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "places" ADD CONSTRAINT "FK_a675f4d5aab30da0df6f7ee234e" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "places" DROP CONSTRAINT "FK_a675f4d5aab30da0df6f7ee234e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a675f4d5aab30da0df6f7ee234"`,
    );
    await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "createdById"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
