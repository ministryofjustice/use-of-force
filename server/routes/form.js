const express = require('express')
const flash = require('connect-flash')
const { getIn, isNilOrEmpty, getFieldName, pickBy, firstItem } = require('../utils/utils')
const { getPathFor } = require('../utils/routes')
const getFormData = require('../middleware/getFormData')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const incidentConfig = require('../config/incident')
const transportConfig = require('../config/transport')
const agile = require('../config/agile')

const formConfig = {
  ...incidentConfig,
  ...transportConfig,
  ...agile,
}

const renderForm = (req, res, section, form, data = {}) => {
  const backLink = req.get('Referrer')
  const pageData = firstItem(req.flash('userInput')) || getIn([section, form], res.locals.formObject)
  const errors = req.flash('errors')
  res.render(`formPages/${section}/${form}`, {
    data: { ...pageData, ...data },
    formName: form,
    backLink,
    errors,
  })
}

module.exports = function Index({ formService, authenticationMiddleware, nomisService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(getFormData(formService))
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get(
    '/incident/newIncident/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const offenderDetail = await nomisService.getOffenderDetails(res.locals.user.token, bookingId)
      const { displayName, offenderNo } = offenderDetail
      const data = { displayName, offenderNo }
      renderForm(req, res, 'incident', 'newIncident', data)
    })
  )

  router.get(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { section, form } = req.params
      renderForm(req, res, section, form)
    })
  )

  router.post(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { section, form, bookingId } = req.params
      const formPageConfig = formConfig[form]
      const expectedFields = formPageConfig.fields.map(getFieldName)
      const inputForExpectedFields = pickBy((val, key) => expectedFields.includes(key), req.body)

      if (formPageConfig.validate) {
        const formResponse = inputForExpectedFields
        const errors = formService.getValidationErrors(formResponse, formPageConfig)

        if (!isNilOrEmpty(errors)) {
          req.flash('errors', errors)
          req.flash('userInput', inputForExpectedFields)
          return res.redirect(`/form/${section}/${form}/${bookingId}`)
        }
      }

      await formService.update({
        userId: req.user.username,
        formId: res.locals.formId,
        formObject: res.locals.formObject,
        config: formPageConfig,
        userInput: req.body,
        formSection: section,
        formName: form,
      })

      const nextPath = getPathFor({ data: req.body, config: formConfig[form] })
      return res.redirect(`${nextPath}${bookingId}`)
    })
  )

  return router
}
