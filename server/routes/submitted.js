const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:reportId',
    asyncMiddleware(async (req, res) => {
      res.render('pages/submitted', { data: res.locals.formObject, reportId: req.params.reportId })
    })
  )

  return router
}
