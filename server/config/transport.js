module.exports = {
  commute: {
    fields: [{ commuteVia: {} }],
    nextPath: {
      path: '/form/transport/car/',
    },
  },

  car: {
    fields: [
      { haveCar: {} },
      { make: { dependentOn: 'haveCar', predicate: 'Yes' } },
      { model: { dependentOn: 'haveCar', predicate: 'Yes' } },
    ],
    nextPath: {
      path: '/tasklist',
    },
  },
}
