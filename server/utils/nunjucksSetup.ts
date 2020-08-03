import nunjucks from 'nunjucks'
import moment from 'moment'
import nodeCrypto from 'crypto'
import querystring from 'querystring'
import config from '../config'
import { PageMetaData } from './page'

const {
  googleTagManager: { key: tagManagerKey, environment: tagManagerEnvironment },
  links,
} = config

export default function (app, path) {
  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/@ministryofjustice/frontend',
    ],
    {
      autoescape: true,
      express: app,
    }
  )

  njkEnv.addGlobal('googleTagManagerContainerId', tagManagerKey)
  njkEnv.addGlobal('googleTagManagerEnvironment', tagManagerEnvironment)
  njkEnv.addGlobal('links', links)

  njkEnv.addFilter('findError', (array, formFieldId) => {
    const item = array.find(error => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  njkEnv.addFilter('findErrors', (errors, formFieldIds) => {
    const fieldIds = formFieldIds.map(field => `#${field}`)
    const errorIds = errors.map(error => error.href)
    const firstPresentFieldError = fieldIds.find(fieldId => errorIds.includes(fieldId))
    if (firstPresentFieldError) {
      return { text: errors.find(error => error.href === firstPresentFieldError).text }
    }
    return null
  })

  njkEnv.addFilter('hasErrorWithPrefix', (errorsArray, prefixes) => {
    const formattedPrefixes = prefixes.map(field => `#${field}`)
    return errorsArray.some(error => formattedPrefixes.some(prefix => error.href.startsWith(prefix)))
  })

  njkEnv.addFilter('formatDate', (value, format) => {
    return value ? moment(value).format(format) : null
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

  njkEnv.addFilter('extractAttr', (array, key) => {
    return array.map(item => item[key])
  })

  njkEnv.addFilter('isArray', value => {
    return Array.isArray(value)
  })

  njkEnv.addFilter('toOptions', (array, valueKey, textKey) => {
    return array.map(item => ({
      value: item[valueKey],
      label: item[textKey],
    }))
  })

  njkEnv.addFilter('toPagination', (pageData: PageMetaData, query: any = {}) => {
    const urlForPage = n => `?${querystring.stringify({ ...query, page: n })}`
    const items = [...Array(pageData.totalPages).keys()].map(n => ({
      text: n + 1,
      href: urlForPage(n + 1),
      selected: n + 1 === pageData.page,
    }))
    return {
      results: {
        from: pageData.min,
        to: pageData.max,
        count: pageData.totalCount,
      },
      previous: pageData.previousPage && {
        text: 'Previous',
        href: urlForPage(pageData.previousPage),
      },
      next: pageData.nextPage && {
        text: 'Next',
        href: urlForPage(pageData.nextPage),
      },
      items,
    }
  })

  njkEnv.addFilter('toYesNo', value => {
    if (value == null) {
      return '\u2013'
    }
    return value ? 'Yes' : 'No'
  })

  njkEnv.addFilter('MD5', value => (value ? nodeCrypto.createHash('md5').update(value).digest('hex') : value))
}
