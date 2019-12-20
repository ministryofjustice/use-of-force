const express = require('express')
const path = require('path')
const httpError = require('http-errors')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware, offenderService, reportingService, involvedStaffService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  const placeHolder = path.join(__dirname, '../assets/images/image-missing.png')

  router.get('/offender/:bookingId/image', (req, res) => {
    const { bookingId } = req.params

    offenderService
      .getOffenderImage(res.locals.user, bookingId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(error => {
        res.sendFile(placeHolder)
      })
  })

  /**
   * TODO: integrate this into the app properly once we have designs and time.
   * This is currently a GET to get around CSRF issues and to allow access via a browser using current authenticated session :-/
   */
  router.get(
    '/report/:reportId/involved-staff/:username',
    asyncMiddleware(async (req, res) => {
      if (!res.locals.user.isReviewer) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { reportId, username } = req.params

      await involvedStaffService.addInvolvedStaff(res.locals.user.token, reportId, username)
      res.json({ result: 'ok' })
    })
  )

  router.get(
    '/reports/mostOftenInvolvedStaff/:year/:month',
    asyncMiddleware(async (req, res) => {
      if (!res.locals.user.isReviewer) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

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
    '/reports/mostOftenInvolvedPrisoners/:year/:month',
    asyncMiddleware(async (req, res) => {
      if (!res.locals.user.isReviewer) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getMostOftenInvolvedPrisoners(
        res.locals.user.username,
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
