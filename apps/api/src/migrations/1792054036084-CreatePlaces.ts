import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlaces1792054036084 implements MigrationInterface {
  name = 'CreatePlaces1792054036084';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "places" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(200) NOT NULL, "location" geometry(Point,4326) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1afab86e226b4c3bc9a74465c12" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8ee226e91e428a57c5d1ac84c" ON "places" USING gist ("location") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b8ee226e91e428a57c5d1ac84c"`,
    );
    await queryRunner.query(`DROP TABLE "places"`);
  }
}
