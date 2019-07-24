const page = require('./page')

const incidentsPage = () => page('Use of force incidents')

export default {
  verifyOnPage: incidentsPage,
}
