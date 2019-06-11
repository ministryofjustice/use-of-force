const express = require('express')
const flash = require('connect-flash')
const { getIn, isNilOrEmpty, getFieldName, pickBy, firstItem } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const getFormData = require('../middleware/getFormData')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const personalDetailsConfig = require('../config/personalDetails')
const transportConfig = require('../config/transport')
const agile = require('../config/agile')

const formConfig = {
  ...personalDetailsConfig,
  ...transportConfig,
  ...agile,
}

module.exports = function Index({ formService, authenticationMiddleware }) {
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
    '/:section/:form',
    asyncMiddleware(async (req, res) => {
      const { section, form } = req.params
      const backLink = req.get('Referrer')
      const pageData = firstItem(req.flash('userInput')) || getIn([section, form], res.locals.formObject)
      const errors = req.flash('errors')

      res.render(`formPages/${section}/${form}`, {
        data: pageData,
        formName: form,
        backLink,
        errors,
      })
    })
  )

  router.post(
    '/:section/:form',
    asyncMiddleware(async (req, res) => {
      const { section, form } = req.params
      const formPageConfig = formConfig[form]
      const expectedFields = formPageConfig.fields.map(getFieldName)
      const inputForExpectedFields = pickBy((val, key) => expectedFields.includes(key), req.body)

      if (formPageConfig.validate) {
        const formResponse = inputForExpectedFields
        const errors = formService.getValidationErrors(formResponse, formPageConfig)

        if (!isNilOrEmpty(errors)) {
          req.flash('errors', errors)
          req.flash('userInput', inputForExpectedFields)
          return res.redirect(`/form/${section}/${form}/`)
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
      return res.redirect(`${nextPath}`)
    })
  )

  return router
}
