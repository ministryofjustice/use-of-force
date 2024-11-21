exports.up = async knex => {
  await knex.raw(`CREATE VIEW flyway_schema_history AS SELECT name as version FROM knex_migrations ORDER BY id;`)
}
exports.down = async knex => {
  await knex.raw(`drop VIEW flyway_schema_history`)
}
