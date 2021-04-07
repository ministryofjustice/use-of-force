import crypto from 'crypto'

export const stringToHash = (inputString: string, salt: string): string => {
  return crypto.createHmac('sha256', salt).update(inputString).digest('base64')
}

export const isHashOfString = (hashValue: string, originalString: string, salt: string): boolean => {
  const checkedValue = stringToHash(originalString, salt)
  return hashValue === checkedValue
}
