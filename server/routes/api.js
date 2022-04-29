const express = require('express')
const path = require('path')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { coordinatorOnly } = require('../middleware/roleCheck')

module.exports = function Index(authenticationMiddleware, services) {
  const { offenderService, reportingService, systemToken } = services
  const router = express.Router()

  router.use(authenticationMiddleware)

  const placeHolder = path.join(process.cwd(), '/assets/images/image-missing.png')

  router.get('/offender/:bookingId/image', async (req, res) => {
    const { bookingId } = req.params

    const token = await systemToken(req.user.username)

    await offenderService
      .getOffenderImage(token, bookingId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(() => {
        res.sendFile(placeHolder)
      })
  })
  return router
}
