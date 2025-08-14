import { compareIncidentDetailsEditWithReport } from './incidentDetails'

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
    incidentDate: {
      date: '14/03/2020',
      time: {
        hour: '15',
        minute: '17',
      },
    },
    newAgencyId: '',
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
    agencyId: {
      hasChanged: false,
      newValue: '',
      oldValue: 'WRI',
    },
    authorisedBy: {
      hasChanged: true,
      newValue: 'Joe bloggs',
      oldValue: undefined,
    },
    incidentDate: {
      hasChanged: true,
      newValue: new Date('2020-03-14T15:17:00Z'),
      oldValue: new Date('2020-03-02T14:17:00Z'),
    },
    incidentLocation: {
      hasChanged: false,
      newValue: '12345-ABC',
      oldValue: '12345-ABC',
    },
    plannedUseOfForce: {
      hasChanged: true,
      newValue: 'true',
      oldValue: false,
    },
    witnesses: {
      hasChanged: true,
      newValue: [
        {
          name: 'Tom Smith',
        },
      ],
      oldValue: [],
    },
  }
  it('Should calculate differences correctly', () => {
    const result = compareIncidentDetailsEditWithReport(report, valuesFromRequestBody)
    expect(result).toEqual(expectedResult)
  })
})
