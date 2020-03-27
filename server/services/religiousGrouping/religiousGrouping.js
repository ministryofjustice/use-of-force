const R = require('ramda')

const RELIGION_UNKNOWN = 'UNKN'
const OTHER_GROUP = 'OTHER'

const RELIGIOUS_GROUPS = {
  BUDDHIST: { description: 'Buddhist', religions: ['BUDD'] },
  CHRISTIAN: {
    description: 'Christian',
    religions: [
      'ADV',
      'APO',
      'BAPT',
      'CALV',
      'CCOG',
      'CE',
      'CHRST',
      'CHSC',
      'CINW',
      'COFE',
      'COFI',
      'COFN',
      'COFS',
      'CONG',
      'COPT',
      'CSW',
      'EODX',
      'EORTH',
      'EPIS',
      'ETHO',
      'EVAN',
      'GOSP',
      'GROX',
      'JEHV',
      'LUTH',
      'METH',
      'ORTH',
      'PENT',
      'PRES',
      'PROT',
      'RC',
      'RUSS',
      'SDAY',
    ],
  },
  HINDU: { description: 'Hindu', religions: ['HARE', 'HIND'] },
  JEWISH: { description: 'Jewish', religions: ['JEW'] },
  MUSLIM: { description: 'Muslim', religions: ['BLAC', 'MOS', 'SHIA', 'SUNI'] },
  NONE: { description: 'No religion', religions: ['NIL'] },
  [OTHER_GROUP]: { description: 'Other', religions: ['AGNO', 'ATHE', RELIGION_UNKNOWN] },
  OTHER_RELIGIOUS: { description: 'Other Religious Groups', religions: ['TAO', 'SCIE', 'SATN', 'PAG'] },
  SIKH: { description: 'Sikh', religions: ['SIKH'] },
}

const invertGroupings = R.pipe(
  R.toPairs,
  R.chain(([groupName, { religions }]) => (religions ? religions.map(religion => [religion, groupName]) : [])),
  R.fromPairs
)

const incidentsByReligiousGroupFactory = religionsByGroup => {
  const groupsByReligion = invertGroupings(religionsByGroup)

  return (offenderNumberToIncidentCountMap, prisonersDetails) =>
    prisonersDetails.reduce((accumulator, { offenderNo, religion = RELIGION_UNKNOWN }) => {
      const religiousGroup = groupsByReligion[religion] || OTHER_GROUP
      const accumulatedCount = accumulator[religiousGroup]
      accumulator[religiousGroup] = accumulatedCount + (offenderNumberToIncidentCountMap[offenderNo] || 0)
      return accumulator
    }, R.map(() => 0, religionsByGroup))
}

const incidentsByReligiousGroup = incidentsByReligiousGroupFactory(RELIGIOUS_GROUPS)

const csvRendererConfiguration = Object.entries(RELIGIOUS_GROUPS).map(([religiousGroup, { description }]) => ({
  key: religiousGroup,
  header: description,
}))

module.exports = {
  invertGroupings,
  incidentsByReligiousGroupFactory,
  incidentsByReligiousGroup,
  RELIGION_UNKNOWN,
  OTHER_GROUP,
  csvRendererConfiguration,
}
