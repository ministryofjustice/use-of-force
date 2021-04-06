import page from '../page'

const removalRequestedPage = () => page('Your request has been submitted', {})

module.exports = {
  verifyOnPage: removalRequestedPage,
}
