module.exports = ({ locationService, systemToken }) => {
  const viewPrisons = editMode => async (req, res) => {
    const token = await systemToken(res.locals.user.username)
    const prisons = await locationService.getPrisons(token)
    const errors = req.flash('errors')
    const data = { prisons, editMode, errors }
    res.render('formPages/incident/changePrison', data)
  }

  const submit = editMode => async (req, res) => {
    const { bookingId } = req.params
    const { agencyId } = req.body
    const { username } = res.locals.user
    const saveAndContinue = req.body.submit === 'save-and-continue'

    if (saveAndContinue) {
      const error = [
        {
          text: 'What prison did the use of force take place in?',
          href: '#agencyId',
        },
      ]

      if (!agencyId) {
        req.flash('errors', error)
        return res.redirect(req.originalUrl)
      }

      await locationService.updateAgencyId(agencyId, username, bookingId)
    }

    return res.redirect(`/report/${bookingId}/${editMode ? 'edit-' : ''}incident-details`)
  }

  return {
    viewPrisons: editMode => viewPrisons(editMode),
    submit: submit(false),
    submitEdit: submit(true),
  }
}
