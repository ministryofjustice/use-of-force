
type User = {
    staffId: Number 
    username: String
    firstName: String
    lastName: String
    activeCaseLoadId: string
    accountStatus: String
    active: Boolean
    caseLoadId: String
    description: String
    type: String
    caseloadFunction: String
    currentlyActive: Boolean
    displayname: String
}

type GetUsersResults = {
    username: String
    missing: Boolean
    verified: Boolean

    email?: String // only if exists and verified
    name?: String // only if exists
    staffId?: Number // only if exists
}

export interface UserService {
    /** get current user */
    getUser: (token: String) => Promise<User>
    /** Get details for users along with email address */
    getUsers: (token: String, usernames: String[]) => Promise<GetUsersResults[]>

}