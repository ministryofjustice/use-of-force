const express = require('express')
const flash = require('connect-flash')
const { getIn, isNilOrEmpty, getFieldName, pickBy, firstItem } = require('../utils/utils')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const incidentConfig = require('../config/incident')

const formConfig = {
  ...incidentConfig,
}

const renderForm = ({ req, res, formObject, section, form, data = {} }) => {
  const backLink = req.get('Referrer')
  const { bookingId } = req.params
  const pageData = firstItem(req.flash('userInput')) || getIn([section, form], formObject)
  const errors = req.flash('errors')
  res.render(`formPages/${section}/${form}`, {
    data: { bookingId, ...pageData, ...data },
    formName: form,
    backLink,
    errors,
  })
}

module.exports = function Index({ formService, authenticationMiddleware, offenderService }) {
  const loadForm = async req => {
    const { bookingId } = req.params
    const { form_response: formObject = {}, id: formId } = await formService.getFormResponse(
      req.user.username,
      bookingId
    )
    return { formId, formObject }
  }

  const router = express.Router()

  router.use(authenticationMiddleware())
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
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
      const { displayName, offenderNo, locations } = offenderDetail

      const section = 'incident'
      const form = 'newIncident'

      const { formObject } = await loadForm(req, res)
      const pageData = firstItem(req.flash('userInput')) || getIn([section, form], formObject) || {}

      const data = {
        displayName,
        offenderNo,
        locations: [
          {
            value: '',
            text: '-- Select --',
            selected: pageData.location === '',
          },
        ].concat(
          locations.map(location => ({
            value: location.locationId,
            text: location.userDescription,
            selected: pageData.locationId === location.locationId,
          }))
        ),
      }

      renderForm({ req, res, formObject, data, section, form })
    })
  )

  router.get(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { section, form } = req.params
      const { formObject } = await loadForm(req, res)
      renderForm({ req, res, formObject, section, form })
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

      const { formId, formObject } = await loadForm(req, res)

      await formService.update({
        formId,
        formObject,
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: req.body,
        formSection: section,
        formName: form,
      })

      const nextPath = getPathFor({ data: req.body, config: formConfig[form] })
      const location = req.body.submit === 'save-and-continue' ? `${nextPath}${bookingId}` : `/tasklist/${bookingId}`
      return res.redirect(location)
    })
  )

  return router
}
