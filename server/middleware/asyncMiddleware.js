const db = require('../data/dataAccess/db')

module.exports = fn => (req, res, next) => {
  Promise.resolve(
    db.inTransaction(async () => {
      await fn(req, res)
    })
  ).catch(next)
}
