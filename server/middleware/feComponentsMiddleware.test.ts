import { Response } from 'express'
import feComponentsMiddleware from './feComponentsMiddleware'
import FeComponentsService from '../services/feComponentsService'
import { Services } from '../services'
import logger from '../../log'

jest.mock('../services/feComponentsService')
jest.mock('../../log')

const feComponentsService = new FeComponentsService(null) as jest.Mocked<FeComponentsService>
feComponentsService.getFeComponents = jest.fn().mockResolvedValue({})

let req
let res
const next = jest.fn()

describe('feComponentsMiddleware', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    req = { session: {} }
    res = { locals: { user: {} } } as unknown as Response
    res.locals.user.token = 'token-1'
  })

  test('Should call components service correctly', async () => {
    const header = { html: '<header></header>', javascript: [], css: [] }
    const footer = { html: '<footer></footer>', javascript: [], css: [] }
    feComponentsService.getFeComponents.mockResolvedValue({ header, footer })

    await feComponentsMiddleware(feComponentsService)(req, res, next)

    expect(feComponentsService.getFeComponents).toHaveBeenCalledWith(['header', 'footer'], 'token-1')
    expect(res.locals.feComponents).toEqual({
      header: '<header></header>',
      footer: '<footer></footer>',
      cssIncludes: [],
      jsIncludes: [],
    })
    expect(next).toHaveBeenCalled()
  })

  test('Should keep the active caseload from the components response in the session', async () => {
    const header = { html: '<header></header>', javascript: [], css: [] }
    const footer = { html: '<footer></footer>', javascript: [], css: [] }
    const meta = { activeCaseLoad: { caseLoadId: 'LEI' }, caseLoads: [], services: [] }
    feComponentsService.getFeComponents.mockResolvedValue({ header, footer, meta })
    req.session.activeCaseLoadId = 'MDI'

    await feComponentsMiddleware(feComponentsService)(req, res, next)

    expect(req.session.activeCaseLoadId).toEqual('LEI')
    expect(next).toHaveBeenCalled()
  })

  test('Should leave the session caseload alone when the response has none', async () => {
    const header = { html: '<header></header>', javascript: [], css: [] }
    const footer = { html: '<footer></footer>', javascript: [], css: [] }
    feComponentsService.getFeComponents.mockResolvedValue({ header, footer })
    req.session.activeCaseLoadId = 'MDI'

    await feComponentsMiddleware(feComponentsService)(req, res, next)

    expect(req.session.activeCaseLoadId).toEqual('MDI')
  })

  test('Should log errors', async () => {
    const error = new Error('Failed to retrieve front end components')
    feComponentsService.getFeComponents.mockRejectedValue(error)

    await feComponentsMiddleware(feComponentsService as unknown as Services)(req, res, next)
    expect(logger.error).toHaveBeenCalledWith(error, 'Failed to retrieve front end components')
  })
})
