module.exports = {
  name: {
    fields: [
      {
        fullName: {
          responseType: 'requiredString',
          validationMessage: 'Please give a full name',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/form/personalDetails/dob/',
    },
  },

  dob: {
    fields: [
      {
        day: {
          responseType: 'requiredDay',
          validationMessage: 'Please give a valid day',
        },
      },
      {
        month: {
          responseType: 'requiredMonth',
          validationMessage: 'Please give a valid month',
        },
      },
      {
        year: {
          responseType: 'requiredYear',
          validationMessage: 'Please give a valid year',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/form/personalDetails/address/',
    },
  },

  address: {
    fields: [
      {
        addressLine1: {
          responseType: 'requiredString',
          validationMessage: 'Please give an address line 1',
        },
      },
      {
        addressLine2: {
          responseType: 'optionalString',
          validationMessage: 'Please give an valid address line 1',
        },
      },
      {
        addressTown: {
          responseType: 'requiredString',
          validationMessage: 'Please give a town or city',
        },
      },
      {
        addressCounty: {
          responseType: 'requiredString',
          validationMessage: 'Please give a county',
        },
      },
      {
        addressPostcode: {
          responseType: 'requiredPostcode',
          validationMessage: 'Please give a postcode',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/tasklist',
    },
  },
}
