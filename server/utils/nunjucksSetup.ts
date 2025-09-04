import nunjucks from 'nunjucks'
import path from 'path'
import moment from 'moment'
import nodeCrypto from 'crypto'
import querystring from 'querystring'
import escapeHtml from 'escape-html'
import config from '../config'
import { PageMetaData } from './page'
import { LabelledValue } from '../config/types'
import { SectionStatus } from '../services/drafts/reportStatusChecker'
import { initialiseName, personDateOfBirth, personProfileName } from './utils'

const {
  googleTagManager: { key: tagManagerKey, environment: tagManagerEnvironment },
  links,
} = config

type Error = {
  href: string
  text: string
}

export default function configureNunjucks(app: Express.Application): nunjucks.Environment {
  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist',
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

  njkEnv.addFilter('extractDate', value => {
    return value ? moment(value).format('DD/MM/YYYY') : null
  })

  njkEnv.addFilter('extractTime', value => {
    return value ? moment(value).format('HH:mm') : null
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

    const { page, totalPages, previousPage, nextPage, totalCount, min, max } = pageData
    const items: { text: string; href?: string; selected?: boolean; classes?: string; type: string }[] = []

    const addPage = (n: number) => {
      items.push({
        text: `${n}`,
        href: urlForPage(n),
        selected: n === page,
        type: 'page',
      })
    }

    const addEllipsis = () => {
      items.push({
        text: '…',
        classes: 'govuk-pagination__item--dots',
        selected: false,
        type: 'dots',
      })
    }

    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i += 1) {
        addPage(i)
      }
    } else {
      const isNearStart = page <= 3
      const isNearEnd = page >= totalPages - 2
      if (isNearStart) {
        // e.g. [1] 2 3 … 10
        for (let i = 1; i <= 3; i += 1) addPage(i)
        addEllipsis()
        addPage(totalPages)
      } else if (isNearEnd) {
        // e.g. 1 … 8 9 [10]
        addPage(1)
        addEllipsis()
        for (let i = totalPages - 2; i <= totalPages; i += 1) addPage(i)
      } else {
        // e.g. 1 … 4 [5] 6 … 10
        addPage(1)
        addEllipsis()
        addPage(page - 1)
        addPage(page)
        addPage(page + 1)
        addEllipsis()
        addPage(totalPages)
      }
    }

    return {
      results: {
        from: min,
        to: max,
        count: totalCount,
      },
      previous: previousPage && {
        text: 'Previous',
        href: urlForPage(previousPage),
      },
      next: nextPage &&
        !(totalPages <= 3 && page === totalPages) && {
          text: 'Next',
          href: urlForPage(nextPage),
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

  njkEnv.addFilter('toYesNoIfTrueFalse', value => {
    if (value === 'true' || value === true) return 'Yes'
    if (value === 'false' || value === false) return 'No'
    return value
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
  njkEnv.addFilter('personProfileName', personProfileName)
  njkEnv.addFilter('personDateOfBirth', personDateOfBirth)

  return njkEnv
}
