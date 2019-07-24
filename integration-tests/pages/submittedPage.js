const page = require('./page')

const submittedPage = () => page('Report submitted')

export default {
  verifyOnPage: submittedPage,
}
