const authorisationMiddleware = require('./authorisationMiddleware')

describe('authorisationMiddleware', () => {
  let req
  const reviewerToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJVT0ZfUkVWSUVXRVJfVVNFUiIsInNjb3BlIjpbInJlYWQiLCJ3cml0ZSJdLCJhdXRoX3NvdXJjZSI6Im5vbWlzIiwiZXhwIjoxNTY4MzgxNjI2LCJhdXRob3JpdGllcyI6WyJST0xFX1VTRV9PRl9GT1JDRV9SRVZJRVdFUiJdLCJqdGkiOiI4NWMxZDZiOS02MzFmLTRiNjEtOGYxYS0xMjljMWY2NzYwNWMiLCJjbGllbnRfaWQiOiJ1c2Utb2YtZm9yY2UtY2xpZW50In0.FIPYgSn1VG73VZTJcEClpUUNRhif7FJk89a4IxPZMDr0IbucXLzR3y-moWgTg431fD4aaFLDekaGAUIJOGECFmGrmbE62fmIFP5NH_WSclh34sRJSSASJXmdHboNR-lcuNkY20k5kiE4b8sQw-ri5OUMhswA8q8T7-yU9Zf5r3fvCAPSSxtnvllySwntx0fiiBRizcP2oyPzURjpn5jRMF-1AsYj7Pc1J5GaXypJ8LOmzxtA1wcSEOP-9oxjEGxnlwqZjpUDaojEdywvJxl0fSKWUakynJ5WaA3pKYk27buPeSis9TLjLlTdAwu2JR-3BH-io18CgyCDmxa0cQkwbA'
  const nonReviewerToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJJVEFHX1VTRVIiLCJzY29wZSI6WyJyZWFkIiwid3JpdGUiXSwiYXV0aF9zb3VyY2UiOiJub21pcyIsImV4cCI6MTU2ODM4Mzg5MiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9NQUlOVEFJTl9BQ0NFU1NfUk9MRVNfQURNSU4iLCJST0xFX0NBVEVHT1JJU0FUSU9OX1NFQ1VSSVRZIiwiUk9MRV9HTE9CQUxfU0VBUkNIIiwiUk9MRV9DUkVBVEVfQ0FURUdPUklTQVRJT04iLCJST0xFX09NSUNfQURNSU4iLCJST0xFX0FQUFJPVkVfQ0FURUdPUklTQVRJT04iXSwianRpIjoiODNiNTBhMTAtY2NhNi00MWRiLTk4NWYtZTg3ZWZiMzAzZGRiIiwiY2xpZW50X2lkIjoidXNlLW9mLWZvcmNlLWNsaWVudCJ9.A-q5u8G9b24K8AVkNZsUBsO8TeTumlyE3LiTmpLRPhwj1teYx4iJPOxlX8MYbNWqBLtYnCPt6nT9l2Fyul9gHrwwlk5rHfdvSgX_CreTivwiY8uhGyjbOGgj01Ooo-IlAptQf0SZTLqnNQ3H24y3yzq8JsM6mAOmwI1WwBT84cEakuG0DzzmVQ1_shoyGi07upJDPrcoe_kOQ_z4XOeKfxizkyXkokLDA8Smx8fYJkWDdH1iY8Sk5M81-PFTlTKiAz6HLKl3ghY5JnYLxrmwhKBuUEfGpuPNFL2bteJilz10tqiC5dvnqQBjmgemk0dHu_beRWzcFEJGZ8R7rBMXhA'
  const next = jest.fn()

  const createResWithToken = token => ({
    locals: {
      user: {
        token,
      },
    },
  })

  test('Should populate user.multipleRoles for reviewer', () => {
    const res = createResWithToken(reviewerToken)

    authorisationMiddleware(req, res, next)

    expect(res.locals.user.isReviewer).toEqual(true)
  })

  test('Should populate user.multipleRoles for standard user', () => {
    const res = createResWithToken(nonReviewerToken)

    authorisationMiddleware(req, res, next)

    expect(res.locals.user.isReviewer).toEqual(false)
  })
})
