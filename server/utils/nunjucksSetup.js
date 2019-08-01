const nunjucks = require('nunjucks')

module.exports = (app, path) => {
  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
    ],
    {
      autoescape: true,
      express: app,
    }
  )

  njkEnv.addFilter('findError', (array, formFieldId) => {
    const item = array.find(error => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  njkEnv.addFilter('toSelect', (array, valueKey, textKey, value) => {
    const emptyOption = {
      value: '',
      text: 'Select',
      selected: value === '',
    }
    const items = array.map(item => ({
      value: item[valueKey],
      text: item[textKey],
      selected: item[valueKey] === value,
    }))
    return [emptyOption, ...items]
  })
}
