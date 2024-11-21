exports.up = async knex => {
  await knex.raw(`CREATE VIEW flyway_schema_history AS SELECT name as view FROM knex_migrations ORDER BY id;`)
}
