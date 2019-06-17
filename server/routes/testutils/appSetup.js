/* eslint-disable */

const nunjucks = require('nunjucks')
const express = require('express')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const path = require('path')

module.exports = route => {
  const app = express()

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
