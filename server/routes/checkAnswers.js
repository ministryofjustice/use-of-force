const express = require('express')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ formService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())
  router.use(bodyParser.urlencoded({ extended: false }))

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const errors = req.flash('errors')
      res.render('pages/check-answers', { data: res.locals.formObject, bookingId: req.params.bookingId, errors })
    })
  )

  router.post(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const { confirmed } = req.body
      if (!confirmed) {
        req.flash('errors', [
          {
            text: 'Check that you agree before submitting',
            href: '#confirm',
          },
        ])
        return res.redirect(`/check-answers/${bookingId}`)
      }
      formService.submitForm(req.user.username, bookingId)
      return res.redirect(`/submitted/${bookingId}`)
    })
  )

  return router
}
