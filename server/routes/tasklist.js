module.exports = function TasklistRoutes({ reportService, offenderService }) {
  return {
    viewTasklist: async (req, res) => {
      const { bookingId } = req.params
      const { displayName, offenderNo, dateOfBirth } = await offenderService.getOffenderDetails(
        res.locals.user.token,
        bookingId
      )
      const { form_response: form = {} } = await reportService.getCurrentDraft(req.user.username, bookingId)
      res.render('pages/tasklist', {
        data: { ...res.locals.formObject, displayName, offenderNo, dateOfBirth },
        bookingId: req.params.bookingId,
        form,
      })
    },
  }
}
