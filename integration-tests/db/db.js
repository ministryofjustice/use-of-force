const db = require('../../server/data/dataAccess/db')

module.exports = {
  clearDb() {
    db.queryWithoutTransaction({
      text: 'delete from form',
      values: [],
    })
  },
}
