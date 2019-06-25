const db = require('../../server/data/dataAccess/db')

module.exports = {
  clearDb() {
    const query = {
      text: 'delete from form',
      values: [],
    }
    return db.query(query)
  },
}
