/* eslint-disable */

const express = require('express')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const path = require('path')
const { createNamespace } = require('cls-hooked')
const db = require('../../../server/data/dataAccess/db')
const nunjucksSetup = require('../../utils/nunjucksSetup')

const user = {
  firstName: 'first',
  lastName: 'last',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
}

const appSetup = route => {
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

  nunjucksSetup(app, path)

  app.use((req, res, next) => {
    req.user = user
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

module.exports = { appSetup, user }
