export type Change = { oldValue: unknown; newValue: unknown; question: string }

export type PersistData = {
  reportId: string
  pageInput: unknown
  reportSection: { section: string }
  changes: Change[]
  reason: string
  reasonText: string
  reasonAdditionalInfo: string
  reportOwnerChanged?: boolean
}
