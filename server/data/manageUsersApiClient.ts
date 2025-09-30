import querystring from 'querystring'

import BaseApiClient from './baseApiClient'
import config from '../config'
import { FoundUserResult } from '../types/uof'
import { EmailAddress } from '../types/manageUsersApi/manageUsersApiTypes'

export type EmailResult = {
  email?: string
  username: string
  exists: boolean
  verified: boolean
}

export type UserResult = {
  name: string
  activeCaseLoadId?: string
  staffId: number
}
export default class ManageUsersApiClient extends BaseApiClient {
  protected static config() {
    return config.apis.hmppsManageUsersApi
  }

  async getEmail(username: string, token: string): Promise<EmailResult> {
    const path = `/users/${username}/email`
    const { status, body } = await ManageUsersApiClient.restClient(token).get<{ status: number; body: EmailAddress }>({
      path,
      raw: true,
    })
    return {
      email: body.email,
      username: body.username || username,
      exists: status < 400,
      verified: body.verified,
    }
  }

  async getUser(username: string, token: string): Promise<UserResult> {
    const path = `/users/${username}`
    return ManageUsersApiClient.restClient(token).get({ path })
  }

  async getUsers(usernames: string[], token: string): Promise<UserResult[]> {
    return Promise.all(usernames.map(username => this.getUser(username, token)))
  }

  async findUsers(firstName: string, lastName: string, token: string): Promise<FoundUserResult[]> {
    const path = `/prisonusers`
    return ManageUsersApiClient.restClient(token).get({
      path,
      query: querystring.stringify({ firstName: firstName?.trim(), lastName: lastName?.trim() }),
    })
  }

  async findUsersFuzzySearch(value: string, token: string): Promise<FoundUserResult[]> {
    const path = `/prisonusers/search`
    return ManageUsersApiClient.restClient(token).get({
      path,
      query: querystring.stringify({ nameFilter: value.trim() }),
    })
  }
}
