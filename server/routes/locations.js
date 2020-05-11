const { isNilOrEmpty } = require('../utils/utils')
const { processInput } = require('../services/validation')
const { full } = require('../config/incident')

module.exports = ({ locationService }) => {
  // get list of all prisons
  const viewPrisons = editMode => async (req, res) => {
    const { token } = res.locals.user
    const prisons = await locationService.getActiveAgenciesByType(token, 'INST')
    const errors = req.flash('errors')
    const data = { prisons, editMode, errors }
    res.render('formPages/incident/changePrison', data)
  }

  // submit new prison id
  const submit = (formName, editMode) => async (req, res) => {
    const { bookingId } = req.params
    const { agencyId } = req.body
    const { username } = res.locals.user
    const saveAndContinue = req.body.submit === 'save-and-continue'

    if (saveAndContinue) {
      const { errors } = processInput({
        validationSpec: full[formName],
        input: req.body,
      })

      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        return res.redirect(req.originalUrl)
      }

      await locationService.updateAgencyId(agencyId, username, bookingId)
    }

    return res.redirect(`/report/${bookingId}/${editMode ? 'edit-' : ''}incident-details`)
  }

  return {
    viewPrisons: editMode => viewPrisons(editMode),
    submit: formName => submit(formName, false),
    submitEdit: formName => submit(formName, true),
  }
}
