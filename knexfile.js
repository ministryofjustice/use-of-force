const fs = require('fs')
const config = require('./server/config')

module.exports = {
  client: 'pg',
  connection: {
    host: config.db.server,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
    port: config.db.port,
    ssl:
      config.db.sslEnabled === 'true'
        ? {
            ca: fs.readFileSync('root.cert'),
            rejectUnauthorized: true,
          }
        : false,
  },
  acquireConnectionTimeout: 5000,
}
