exports.up = async knex => {
  await knex.raw(`
  drop VIEW v_statement;
  CREATE VIEW v_statement AS SELECT * FROM statement where deleted is null;`)
}

exports.down = () => {
  // rollback doesn't make sense in this context
}
