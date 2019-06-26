const express = require('express')
const getFormData = require('../middleware/getFormData')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ formService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  const withFormData = getFormData(formService)

  router.get(
    '/:bookingId',
    withFormData,
    asyncMiddleware(async (req, res) => {
      res.render('pages/submitted', { data: res.locals.formObject, bookingId: req.params.bookingId })
    })
  )

  return router
}
