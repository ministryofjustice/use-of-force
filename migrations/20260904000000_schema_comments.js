/*
 * Data dictionary for the use-of-force schema.
 *
 * These comments are read by SchemaSpy (published to GitHub Pages) and by anything else that reads
 * pg_description, including the CSV export for the MOJ Data Catalogue / Glue. Keep them updated when
 * columns are added or their meaning changes - db-tooling/schemaComments.test.ts fails if a table, view
 * or column has no comment.
 *
 * Every column comment ends with a sensitivity classification:
 *
 *   [Sensitivity: NONE]                - not personal data in itself (keys, timestamps, process flags)
 *   [Sensitivity: PERSONAL]            - personal data about a prisoner: identifies or locates them
 *   [Sensitivity: STAFF]               - personal data about a member of staff
 *   [Sensitivity: SPECIAL-CATEGORY]    - UK GDPR Article 9 data (health) or Article 10 offence data
 *   [Sensitivity: OFFICIAL-SENSITIVE]  - not personal data, but damaging if disclosed
 *
 * STAFF is still personal data and still in scope for a staff member's own subject access request. It
 * is separated from PERSONAL so an extract about prisoners can be reasoned about without staff columns
 * inflating the count, and so staff data can be dropped or pseudonymised independently.
 *
 * Three things to understand before using these classifications:
 *
 *   1. They describe the column's own content, not the row's. Every row in this schema belongs to a
 *      use of force incident involving a named prisoner, so the whole record is personal data about
 *      that prisoner however an individual column is tagged. That is what matters for a subject access
 *      request.
 *
 *   2. **The substance of this schema is in five columns.** report.form_response, statement.statement,
 *      statement_amendments.additional_comment, report_log.details and report_edit.changes hold the
 *      actual account of force used on a prisoner, including injuries and healthcare given. An extract
 *      that excludes them is a very different risk proposition from one that includes them.
 *
 *   3. **Every free-text column should be assumed to contain more than its question asks.** Free text
 *      is classified on what people actually write in it, not on the field label.
 *
 * The database is owned by this repository via the knex migrations in migrations/. The Kotlin
 * hmpps-uof-data-api reads it but has no production migrations, so these comments are the source of
 * truth for that consumer too. See docs/data-model.md.
 */

const COMMENTS = `
-- ----------------------------------------------------------------------------------------------
-- report
-- ----------------------------------------------------------------------------------------------
COMMENT ON TABLE report IS 'One use of force incident report. Nothing is ever hard-deleted: "deleted" is a timestamp tombstone, and the application reads and writes through the v_report view. A draft is simply a row with status IN_PROGRESS - there is no separate draft table. The table has no outbound foreign keys and its primary key constraint is still named pk_form, from when the table was called "form".';
COMMENT ON COLUMN report.id IS 'Primary key. The sequence is still named form_id_seq after the original table name. [Sensitivity: NONE]';
COMMENT ON COLUMN report.form_response IS 'The entire report as submitted, as JSON. Holds the reasons force was used, the techniques and restraint positions applied, what was observed, and the relocationAndInjuries section - which records prisoner injuries, hospitalisation, healthcare involvement, the healthcare practitioner''s name and whether staff needed medical attention. Health data about both the prisoner and staff. See docs/report-payload.md for the shape, and reference-data.csv for the permitted values. [Sensitivity: SPECIAL-CATEGORY]';
COMMENT ON COLUMN report.user_id IS 'HMPPS username of the officer who created the report. Nullable in the database - a 2019 migration altered the column and dropped the not-null constraint - but always populated in practice. [Sensitivity: STAFF]';
COMMENT ON COLUMN report.sequence_no IS 'Distinguishes multiple reports by the same officer against the same booking. Computed as MAX(sequence_no) + 1 for that user and booking. [Sensitivity: NONE]';
COMMENT ON COLUMN report.booking_id IS 'NOMIS booking id: the custody period of the prisoner force was used on. Defaults to -1 where unknown. [Sensitivity: PERSONAL]';
COMMENT ON COLUMN report.created_date IS 'When the report was created. Originally named start_date. [Sensitivity: NONE]';
COMMENT ON COLUMN report.status IS 'IN_PROGRESS, SUBMITTED or COMPLETE. No check constraint - the application enforces it. See reference-data.csv. [Sensitivity: NONE]';
COMMENT ON COLUMN report.submitted_date IS 'When the reporting officer submitted the report, which is what creates the statement rows. Null while still a draft. [Sensitivity: NONE]';
COMMENT ON COLUMN report.offender_no IS 'NOMIS offender number of the prisoner force was used on. The identifier that makes every row in this schema personal data about that prisoner. [Sensitivity: PERSONAL]';
COMMENT ON COLUMN report.reporter_name IS 'Display name of the reporting officer, captured at creation so the report reads correctly even after the officer leaves. [Sensitivity: STAFF]';
COMMENT ON COLUMN report.incident_date IS 'When force was used. Extracted out of form_response into its own column so it can be indexed and searched. Places a named prisoner at a point in time. [Sensitivity: PERSONAL]';
COMMENT ON COLUMN report.agency_id IS 'Prison the incident happened at, as a NOMIS agency code such as MDI. Stamped at creation and updatable through the change-prison flow. With incident_date, locates a named prisoner. [Sensitivity: PERSONAL]';
COMMENT ON COLUMN report.updated_date IS 'When the report was last changed. [Sensitivity: NONE]';
COMMENT ON COLUMN report.deleted IS 'Soft-delete tombstone. Non-null rows are filtered out by the v_report view; nothing is physically removed. [Sensitivity: NONE]';
COMMENT ON COLUMN report.completed_date IS 'Intended to record when every required statement had been submitted. Added October 2025 and not yet written or read by anything - do not rely on it. [Sensitivity: NONE]';

-- ----------------------------------------------------------------------------------------------
-- statement
-- ----------------------------------------------------------------------------------------------
COMMENT ON TABLE statement IS 'One member of staff''s account of a use of force incident, created for each involved officer when the report is submitted. Originally called involved_staff, which still shows in its index names. Read and written through the v_statement view.';
COMMENT ON COLUMN statement.id IS 'Primary key. The sequence is still named involved_staff_id_seq after the original table name. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.report_id IS 'The report this statement belongs to. Foreign key to report(id) with ON DELETE CASCADE. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.user_id IS 'HMPPS username of the officer the statement is required from. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.name IS 'Display name of that officer. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.email IS 'Email address used to send statement reminders. May be backfilled later by the reminder job rather than set at creation. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.submitted_date IS 'When the officer submitted their statement. Null while still outstanding. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.statement_status IS 'PENDING or SUBMITTED. See reference-data.csv. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.last_training_month IS 'Month of the officer''s most recent control and restraint training, as a ZERO-BASED index: 0 is January and 11 is December, not 1 to 12. Employment record data. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.last_training_year IS 'Year of the officer''s most recent control and restraint training. Employment record data. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.job_start_year IS 'Year the officer started in the role. Employment record data. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.statement IS 'The officer''s free-text account of the force used on a named prisoner. Routinely records injuries and the healthcare given (Article 9 health data) and describes conduct that may become a criminal or disciplinary allegation against the prisoner or the officer (Article 10). [Sensitivity: SPECIAL-CATEGORY]';
COMMENT ON COLUMN statement.staff_id IS 'NOMIS staff id of the officer. Originally not-null with a -1 default; a 2019 migration made it nullable and dropped the default. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.created_date IS 'When the statement row was created, which is when the report was submitted. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.updated_date IS 'When the statement was last changed. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.next_reminder_date IS 'When the reminder job should next chase this statement. Set to submission plus one day, advanced daily, and nulled once the statement is overdue. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.overdue_date IS 'When the statement becomes overdue - submission plus three days. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.in_progress IS 'Whether the officer has saved a draft of their statement without submitting it. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.deleted IS 'Soft-delete tombstone. Non-null rows are filtered out by the v_statement view. [Sensitivity: NONE]';
COMMENT ON COLUMN statement.removal_requested_reason IS 'Free text written by the member of staff themselves, asking to be removed from the report because they were not involved. Tagged STAFF because it is their own account of their own involvement, but it is free text and can carry health or personal-circumstance detail - handle it with the same care as a special category column. [Sensitivity: STAFF]';
COMMENT ON COLUMN statement.removal_requested_date IS 'When removal from the report was requested. [Sensitivity: NONE]';

-- ----------------------------------------------------------------------------------------------
-- statement_amendments
-- ----------------------------------------------------------------------------------------------
COMMENT ON TABLE statement_amendments IS 'Additional comments added by a member of staff after their statement was submitted. A statement is never edited in place; corrections are appended here. Read and written through the v_statement_amendments view.';
COMMENT ON COLUMN statement_amendments.id IS 'Primary key. [Sensitivity: NONE]';
COMMENT ON COLUMN statement_amendments.statement_id IS 'The statement being amended. Foreign key to statement(id) with ON DELETE CASCADE. [Sensitivity: NONE]';
COMMENT ON COLUMN statement_amendments.additional_comment IS 'Free-text addition to a submitted statement. Same content and the same risks as statement.statement - an account of force used on a named prisoner, including injuries and healthcare. [Sensitivity: SPECIAL-CATEGORY]';
COMMENT ON COLUMN statement_amendments.date_submitted IS 'When the amendment was submitted. [Sensitivity: NONE]';
COMMENT ON COLUMN statement_amendments.deleted IS 'Soft-delete tombstone. Non-null rows are filtered out by the v_statement_amendments view. [Sensitivity: NONE]';

-- ----------------------------------------------------------------------------------------------
-- report_log
-- ----------------------------------------------------------------------------------------------
COMMENT ON TABLE report_log IS 'Audit trail of what happened to a report. Its primary key constraint is named pk_audit. report_id is a plain bigint with NO foreign key to report, deliberately, so audit rows survive the report being soft-deleted - which is why SchemaSpy draws this table with no relationship line to report.';
COMMENT ON COLUMN report_log.id IS 'Primary key. [Sensitivity: NONE]';
COMMENT ON COLUMN report_log."timestamp" IS 'When the action happened. [Sensitivity: NONE]';
COMMENT ON COLUMN report_log.username IS 'HMPPS username of the person who acted, or the literal SYSTEM for automatic status transitions. [Sensitivity: STAFF]';
COMMENT ON COLUMN report_log.report_id IS 'The report acted on. Not a declared foreign key - see the table comment. [Sensitivity: NONE]';
COMMENT ON COLUMN report_log.action IS 'What happened: REPORT_CREATED, REPORT_MODIFIED, REPORT_DELETED, REPORT_SUBMITTED, REPORT_STATUS_CHANGED or REPORT_COMPLETED. See reference-data.csv. [Sensitivity: NONE]';
COMMENT ON COLUMN report_log.details IS 'Context for the action, as JSON. For REPORT_MODIFIED this holds originalSection and updatedSection - whole before and after slices of report.form_response - so it carries the same incident, injury and healthcare content as the report itself. [Sensitivity: SPECIAL-CATEGORY]';

-- ----------------------------------------------------------------------------------------------
-- report_edit
-- ----------------------------------------------------------------------------------------------
COMMENT ON TABLE report_edit IS 'History of post-submission edits made through the coordinator edit flow. Its primary key constraint is named pk_edit. As with report_log, report_id has NO foreign key to report, so edit history survives a soft-delete and SchemaSpy draws no relationship line.';
COMMENT ON COLUMN report_edit.id IS 'Primary key. [Sensitivity: NONE]';
COMMENT ON COLUMN report_edit.edit_date IS 'When the edit was made. Originally named timestamp. [Sensitivity: NONE]';
COMMENT ON COLUMN report_edit.editor_user_id IS 'HMPPS username of the coordinator who made the edit. Originally named user_id. [Sensitivity: STAFF]';
COMMENT ON COLUMN report_edit.editor_name IS 'Display name of that coordinator. Originally named user_name. [Sensitivity: STAFF]';
COMMENT ON COLUMN report_edit.report_id IS 'The report that was edited. Not a declared foreign key - see the table comment. [Sensitivity: NONE]';
COMMENT ON COLUMN report_edit.reason IS 'Coded reason for the edit, covering the edit, add-staff, remove-staff and delete-report journeys. See reference-data.csv for the permitted values. [Sensitivity: NONE]';
COMMENT ON COLUMN report_edit.additional_comments IS 'Free text from the coordinator expanding on the edit. Not a health or offence question in itself, but free text about a named prisoner''s report and capable of carrying that detail. [Sensitivity: PERSONAL]';
COMMENT ON COLUMN report_edit.report_owner_changed IS 'Whether this edit reassigned the report to a different reporting officer. [Sensitivity: NONE]';
COMMENT ON COLUMN report_edit.changes IS 'What the edit changed, as JSON keyed by field, each entry holding oldValue, newValue and the question text. Contains arbitrary before and after slices of the report, including involved staff and the relocation and injuries answers. See docs/report-payload.md. [Sensitivity: SPECIAL-CATEGORY]';
COMMENT ON COLUMN report_edit.reason_text IS 'Free text supplied when the coded reason is "another reason". Same caveat as additional_comments. [Sensitivity: PERSONAL]';

-- ----------------------------------------------------------------------------------------------
-- Views
-- ----------------------------------------------------------------------------------------------
COMMENT ON VIEW v_report IS 'Live reports: report filtered to deleted IS NULL. The application reads and writes through this view rather than the base table, so a soft-deleted report disappears from the service without being destroyed. It is a simple auto-updatable Postgres view, so UPDATE and INSERT work against it. Columns are as per report.';
COMMENT ON VIEW v_statement IS 'Live statements: statement filtered to deleted IS NULL, auto-updatable, and the path the application uses. Columns are as per statement.';
COMMENT ON VIEW v_statement_amendments IS 'Live statement amendments: statement_amendments filtered to deleted IS NULL, auto-updatable, and the path the application uses. Columns are as per statement_amendments.';

-- ----------------------------------------------------------------------------------------------
-- Migration bookkeeping
--
-- Not part of the domain schema, but published in the report, so it is documented rather than left to
-- puzzle the reader. db-tooling/schemaComments.test.ts deliberately does not enforce comments here:
-- knex owns the shape of these objects and a knex upgrade must not fail the build.
-- ----------------------------------------------------------------------------------------------
COMMENT ON TABLE knex_migrations IS 'Knex''s own record of which migrations have been applied. Not part of the use of force domain schema.';
COMMENT ON COLUMN knex_migrations.id IS 'Primary key. [Sensitivity: NONE]';
COMMENT ON COLUMN knex_migrations.name IS 'Migration filename as it appears in migrations/. [Sensitivity: NONE]';
COMMENT ON COLUMN knex_migrations.batch IS 'Which batch the migration was applied in; a batch is one run of migrate.latest(). [Sensitivity: NONE]';
COMMENT ON COLUMN knex_migrations.migration_time IS 'When the migration was applied. [Sensitivity: NONE]';

COMMENT ON TABLE knex_migrations_lock IS 'Knex''s advisory lock, preventing two instances migrating at once. Migrations run at application boot, so every pod attempts them on start.';
COMMENT ON COLUMN knex_migrations_lock."index" IS 'Primary key. [Sensitivity: NONE]';
COMMENT ON COLUMN knex_migrations_lock.is_locked IS 'Non-zero while a migration run holds the lock. [Sensitivity: NONE]';

COMMENT ON VIEW flyway_schema_history IS 'NOT A FLYWAY TABLE, AND THIS IS NOT A FLYWAY REPOSITORY. It is a view over knex_migrations created by migrations/20241120000001_form_db.js purely so tooling that expects Flyway keeps working - specifically the HMPPS subject access request test support library, which asserts an expected schema version. This repository uses knex; schema changes belong in migrations/. Running Flyway against this database will collide with this view.';
COMMENT ON COLUMN flyway_schema_history.version IS 'The knex migration filename, presented as if it were a Flyway version. [Sensitivity: NONE]';
`

/*
 * v_report, v_statement and v_statement_amendments are SELECT * views, so their column comments are
 * copied from the base tables rather than duplicated by hand - hand-written duplicates would drift the
 * first time a column changed. Postgres freezes SELECT * at CREATE time, so adding a column already
 * requires a CREATE OR REPLACE VIEW; re-run this block in that same migration and the guard test will
 * tell you if you forget.
 */
const COPY_COMMENTS_TO_VIEWS = `
DO $$
DECLARE
  v record;
  c record;
BEGIN
  FOR v IN SELECT * FROM (VALUES
      ('v_report', 'report'),
      ('v_statement', 'statement'),
      ('v_statement_amendments', 'statement_amendments')
    ) AS t(view_name, base_table)
  LOOP
    FOR c IN
      SELECT va.attname, col_description(bc.oid, ba.attnum) AS comment
      FROM pg_class vc
      JOIN pg_attribute va ON va.attrelid = vc.oid AND va.attnum > 0 AND NOT va.attisdropped
      JOIN pg_class bc ON bc.relname = v.base_table AND bc.relnamespace = 'public'::regnamespace
      JOIN pg_attribute ba ON ba.attrelid = bc.oid AND ba.attname = va.attname
                          AND ba.attnum > 0 AND NOT ba.attisdropped
      WHERE vc.relname = v.view_name AND vc.relnamespace = 'public'::regnamespace
    LOOP
      EXECUTE format('COMMENT ON COLUMN %I.%I IS %L', v.view_name, c.attname, c.comment);
    END LOOP;
  END LOOP;
END $$;
`

exports.up = async knex => {
  await knex.raw(COMMENTS)
  await knex.raw(COPY_COMMENTS_TO_VIEWS)
}

exports.down = async knex => {
  const objects = [
    ['report', 'TABLE'],
    ['statement', 'TABLE'],
    ['statement_amendments', 'TABLE'],
    ['report_log', 'TABLE'],
    ['report_edit', 'TABLE'],
    ['knex_migrations', 'TABLE'],
    ['knex_migrations_lock', 'TABLE'],
    ['v_report', 'VIEW'],
    ['v_statement', 'VIEW'],
    ['v_statement_amendments', 'VIEW'],
    ['flyway_schema_history', 'VIEW'],
  ]

  await knex.raw(`
    DO $$
    DECLARE
      c record;
    BEGIN
      FOR c IN
        SELECT rel.relname, att.attname
        FROM pg_class rel
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum > 0 AND NOT att.attisdropped
        WHERE rel.relnamespace = 'public'::regnamespace AND rel.relkind IN ('r', 'v')
      LOOP
        EXECUTE format('COMMENT ON COLUMN %I.%I IS NULL', c.relname, c.attname);
      END LOOP;
    END $$;
  `)

  await Promise.all(objects.map(([name, kind]) => knex.raw(`COMMENT ON ${kind} ${name} IS NULL`)))
}
