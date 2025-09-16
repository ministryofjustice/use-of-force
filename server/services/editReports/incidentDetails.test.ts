import compareIncidentDetailsEditWithReport from './incidentDetails'

describe('compareIncidentDetailsEditWithReport', () => {
  const report = {
    id: 1,
    incidentDate: new Date('2020-03-02T14:17:00Z'),
    agencyId: 'WRI',
    form: {
      incidentDetails: {
        locationId: 12345,
        plannedUseOfForce: false,
        incidentLocationId: '12345-ABC',
      },
    },
  }
  const valuesFromRequestBody = {
    incidentDate: new Date('2020-03-02T14:17:00Z'),
    newAgencyId: 'MDI',
    incidentLocationId: '12345-ABC',
    plannedUseOfForce: 'true',
    authorisedBy: 'Joe bloggs',
    witnesses: [
      {
        name: 'Tom Smith',
      },
    ],
  }

  const expectedResult = {
    agencyId: { hasChanged: true, newValue: 'MDI', oldValue: 'WRI', question: 'Prison' },
    authorisedBy: {
      hasChanged: true,
      newValue: 'Joe bloggs',
      oldValue: undefined,
      question: 'Who authorised use of force?',
    },
    incidentDate: {
      hasChanged: false,
      newValue: new Date('2020-03-02T14:17:00Z'),
      oldValue: new Date('2020-03-02T14:17:00Z'),
      question: 'When did the incident happen?',
    },
    incidentLocation: {
      hasChanged: false,
      newValue: '12345-ABC',
      oldValue: '12345-ABC',
      question: 'Where did the incident happen?',
    },
    plannedUseOfForce: { hasChanged: true, newValue: 'true', oldValue: false, question: 'Was use of force planned?' },
    witnesses: {
      hasChanged: true,
      newValue: [{ name: 'Tom Smith' }],
      oldValue: undefined,
      question: 'Witnesses to the incident',
    },
  }
  it('Should calculate differences correctly', () => {
    const result = compareIncidentDetailsEditWithReport(report, valuesFromRequestBody)
    expect(result).toEqual(expectedResult)
  })
})
