const page = require('./page')

const submittedPage = () => page('Report sent')

export default {
  verifyOnPage: submittedPage,
}
