const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ reportService, offenderService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const { displayName, offenderNo, dateOfBirth } = await offenderService.getOffenderDetails(
        res.locals.user.token,
        bookingId
      )
      const { form_response: form = {} } = await reportService.getCurrentDraft(req.user.username, bookingId)
      res.render('pages/tasklist', {
        data: { ...res.locals.formObject, displayName, offenderNo, dateOfBirth },
        bookingId: req.params.bookingId,
        form,
      })
    })
  )

  return router
}
