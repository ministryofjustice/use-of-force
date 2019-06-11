module.exports = {
  experience: {
    fields: [{ workedPreviously: {} }],
    nextPath: {
      decisions: [
        {
          discriminator: 'workedPreviously',
          Yes: '/form/agile/opinion',
          No: '/tasklist',
        },
      ],
    },
  },

  opinion: {
    fields: [{ response: {} }],
    nextPath: {
      path: '/tasklist',
    },
  },
}
