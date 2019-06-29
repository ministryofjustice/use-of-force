module.exports = formService => async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const { form_response: response = {}, id } = await formService.getFormResponse(req.user.username, bookingId)

    res.locals.formObject = response
    res.locals.formId = id

    next()
  } catch (error) {
    // TODO proper error handling
    res.redirect('/')
  }
}
