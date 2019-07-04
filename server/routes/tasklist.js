const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ formService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const { form_response: form = {} } = await formService.getFormResponse(req.user.username, bookingId)
      res.render('pages/tasklist', { data: res.locals.formObject, bookingId: req.params.bookingId, form })
    })
  )

  return router
}
