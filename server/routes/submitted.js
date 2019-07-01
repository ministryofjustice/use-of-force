const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      res.render('pages/submitted', { data: res.locals.formObject, bookingId: req.params.bookingId })
    })
  )

  return router
}
