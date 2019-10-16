const express = require('express')
const path = require('path')
const httpError = require('http-errors')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware, offenderService, reportingService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  const placeHolder = path.join(__dirname, '../assets/images/image-missing.png')

  router.get('/offender/:bookingId/image', (req, res) => {
    const { bookingId } = req.params
    offenderService
      .getOffenderImage(res.locals.user.token, bookingId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(error => {
        res.sendFile(placeHolder)
      })
  })

  router.get(
    '/reports/mostOftenInvolvedStaff/:agencyId/:year/:month',
    asyncMiddleware(async (req, res) => {
      if (!res.locals.user.isReviewer) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { agencyId, year, month } = req.params
      const results = await reportingService.getMostOftenInvolvedStaff(
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="involved-staff-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )

  router.get(
    '/reports/mostOftenInvolvedPrisoners/:agencyId/:year/:month',
    asyncMiddleware(async (req, res) => {
      if (!res.locals.user.isReviewer) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { agencyId, year, month } = req.params
      const results = await reportingService.getMostOftenInvolvedPrisoners(
        res.locals.user.token,
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="prisoners-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )

  return router
}
