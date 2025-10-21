/* eslint-disable @typescript-eslint/no-explicit-any */
export type Change = { oldValue: unknown; newValue: unknown; question: string }

export type PersistData = {
  reportId: string
  pageInput: any
  reportSection: { section: string }
  changes: Record<string, Change>
  reason: string
  reasonText: string
  reasonAdditionalInfo: string
  reportOwnerChanged?: boolean
}
