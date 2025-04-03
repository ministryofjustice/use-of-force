const express = require('express')
const path = require('path')

export default function Index(authenticationMiddleware, services) {
  const { offenderService, systemToken } = services
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
