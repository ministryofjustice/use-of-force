import page from '../page'

const NoSearchResultsPage = () => page('There are no search results', {})

module.exports = {
  verifyOnPage: NoSearchResultsPage,
}
