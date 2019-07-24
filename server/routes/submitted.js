const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:incidentId',
    asyncMiddleware(async (req, res) => {
      res.render('pages/submitted', { data: res.locals.formObject, incidentId: req.params.incidentId })
    })
  )

  return router
}
