import nunjucks from 'nunjucks'
import express from 'express'
import path from 'path'
import moment from 'moment'
import nodeCrypto from 'crypto'
import fs from 'fs'
import querystring from 'querystring'
import escapeHtml from 'escape-html'
import config from '../config'
import { PageMetaData } from './page'
import { LabelledValue } from '../config/types'
import { SectionStatus } from '../services/drafts/reportStatusChecker'
import { initialiseName } from './utils'

const {
  googleTagManager: { key: tagManagerKey, environment: tagManagerEnvironment },
  links,
} = config

type Error = {
  href: string
  text: string
}

export default function configureNunjucks(app: express.Express): void{
  app.set('view engine', 'html')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Use of Force'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    }
  )

  njkEnv.addGlobal('googleTagManagerContainerId', tagManagerKey)
  njkEnv.addGlobal('googleTagManagerEnvironment', tagManagerEnvironment)
  njkEnv.addGlobal('links', links)
  njkEnv.addGlobal('authUrl', config.apis.oauth2.url)
  njkEnv.addGlobal('apiClientId', config.apis.oauth2.apiClientId)
  njkEnv.addGlobal('featureFlagOutageBannerEnabled', config.featureFlagOutageBannerEnabled)
  njkEnv.addGlobal('digitalPrisonServiceUrl', config.apis.digitalPrisonServiceUrl)
  njkEnv.addGlobal('featureFlagReportEditingEnabled', config.featureFlagReportEditingEnabled)

  // eslint-disable-next-line default-param-last
  njkEnv.addFilter('findError', (array: Error[] = [], formFieldId: string) => {
    const item = array.find(error => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  njkEnv.addFilter('findErrors', (errors: Error[], formFieldIds: string[]) => {
    const fieldIds = formFieldIds.map(field => `#${field}`)
    const errorIds = errors.map(error => error.href)
    const firstPresentFieldError = fieldIds.find(fieldId => errorIds.includes(fieldId))
    if (firstPresentFieldError) {
      return { text: errors.find(error => error.href === firstPresentFieldError).text }
    }
    return null
  })

  njkEnv.addFilter('concatErrors', (errors: Error[], formFieldIds: string[]) => {
    const fieldIds = formFieldIds.map(field => `#${field}`)
    const foundErrors = errors.filter(error => fieldIds.includes(error.href))
    if (foundErrors.length === 0) {
      return null
    }

    const errorMessages = foundErrors.map(error => escapeHtml(error.text)).join('<br/>')
    return { html: errorMessages }
  })

  njkEnv.addFilter('isErrorPresent', (errors: Error[], formFieldIds: string[]) => {
    const fieldIds = formFieldIds.map(field => `#${field}`)
    const foundErrors = errors.filter(error => fieldIds.includes(error.href))
    return foundErrors.length !== 0
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

  njkEnv.addFilter('toChecked', <T>(array: T[], valueKey: string, textKey: string, values: T[] = []) => {
    return array.map(item => ({
      value: item[valueKey],
      text: item[textKey],
      checked: values.includes(item[valueKey]),
    }))
  })

  njkEnv.addFilter('extractAttr', (array, key) => {
    return array.map(item => item[key])
  })

  njkEnv.addFilter('isArray', value => {
    return Array.isArray(value)
  })

  njkEnv.addFilter('toArray', value => {
    return Array.isArray(value) ? value : Array.of(value)
  })

  njkEnv.addFilter('toOptions', (array, valueKey, textKey) => {
    return array.map(item => ({
      value: item[valueKey],
      label: item[textKey],
      sub_options_label: item.sub_options_label,
      sub_options: item.sub_options,
      parent: item.parent,
      exclusive: item.exclusive,
    }))
  })

  njkEnv.addFilter('toPagination', (pageData: PageMetaData, query: Record<string, unknown> = {}) => {
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

  njkEnv.addFilter('isActive', (types: LabelledValue[]) => {
    return types.filter(item => !item.inactive)
  })

  njkEnv.addGlobal('composeStatus', (status1: SectionStatus, status2: SectionStatus): SectionStatus => {
    if (status1 === SectionStatus.COMPLETE && status2 === SectionStatus.COMPLETE) {
      return SectionStatus.COMPLETE
    }
    const status = [status1, status2]
    if (status.includes(SectionStatus.COMPLETE) || status.includes(SectionStatus.INCOMPLETE)) {
      return SectionStatus.INCOMPLETE
    }
    return SectionStatus.NOT_STARTED
  })

  njkEnv.addFilter('initialiseName', initialiseName)
  
  let assetManifest: Record<string, string> = {}
  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
    }
  }
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
}
