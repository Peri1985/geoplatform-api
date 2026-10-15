import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Who did it; kept as NULL when the user is deleted, so the history stays
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      // What happened, e.g. "files.created", "users.updated", "files.url_issued"
      table.string('action', 100).notNullable()

      // On which record (polymorphic, like files.attachable_*): table name and id
      table.string('subject_type', 100).nullable()
      table.uuid('subject_id').nullable()

      // The values (created/deleted) or { field: { from, to } } (updated); never passwords
      table.jsonb('changes').nullable()

      // Where it came from
      table.string('ip', 45).nullable()
      table.text('user_agent').nullable()
      table.string('request_id', 64).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id', 'created_at'])
      table.index(['subject_type', 'subject_id'])
      table.index(['created_at'])
    })

    // Append-only: rows can be added and pruned, never changed. The one exception is
    // the foreign key itself setting user_id to NULL when a user is deleted.
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION audit_logs_no_update() RETURNS trigger AS $$
      BEGIN
        IF NEW.user_id IS NULL AND (to_jsonb(NEW) - 'user_id') = (to_jsonb(OLD) - 'user_id') THEN
          RETURN NEW;
        END IF;
        RAISE EXCEPTION 'audit_logs rows cannot be changed';
      END;
      $$ LANGUAGE plpgsql
    `)
    this.schema.raw(`
      CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION audit_logs_no_update()
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP FUNCTION IF EXISTS audit_logs_no_update()')
  }
}
