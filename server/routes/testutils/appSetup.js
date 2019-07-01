/* eslint-disable */

const nunjucks = require('nunjucks')
const express = require('express')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const path = require('path')
const { createNamespace } = require('cls-hooked')
const db = require('../../../server/data/dataAccess/db')

module.exports = route => {
  const app = express()

  const ns = createNamespace('request.scope')
  const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)

  app.use(async (req, res, next) => {
    ns.bindEmitter(req)
    ns.bindEmitter(res)
    return ns.run(() => next())
  })

  app.set('view engine', 'html')

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
    ],
    {
      autoescape: true,
      express: app,
    }
  )

  njkEnv.addFilter('findError', (array, formFieldId) => {
    const item = array.find(error => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  app.use((req, res, next) => {
    req.user = {
      firstName: 'first',
      lastName: 'last',
      userId: 'id',
      token: 'token',
      username: 'user1',
    }
    res.locals = {}
    res.locals.user = req.user
    next()
  })
  app.use(cookieSession({ keys: [''] }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use('/', route)
  app.use((error, req, res, next) => {
    console.log(error)
  })
  return app
}
