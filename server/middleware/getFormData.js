module.exports = formService => async (req, res, next) => {
  try {
    const formData = await formService.getFormResponse(req.user.username)

    res.locals.formObject = formData.form_response || {}
    res.locals.formId = formData.id

    next()
  } catch (error) {
    // TODO proper error handling
    res.redirect('/')
  }
}
