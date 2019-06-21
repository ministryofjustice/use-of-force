const express = require('express')
const getFormData = require('../middleware/getFormData')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ formService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(getFormData(formService))

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      res.render('pages/tasklist', { data: res.locals.formObject, bookingId: req.params.bookingId })
    })
  )

  return router
}
