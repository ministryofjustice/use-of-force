const R = require('ramda')

const RELIGION_UNKNOWN = 'OTH'
const OTHER_GROUP = 'OTHER'

const RELIGIOUS_GROUPS = {
  BUDDHIST: { description: 'Buddhist', religions: ['BUDD'] },
  CHRISTIAN: {
    description: 'Christian',
    religions: [
      'ADV',
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
      'METH',
      'MORM',
      'NONC',
      'OORTH',
      'PENT',
      'PRES',
      'PROT',
      'QUAK',
      'RC',
      'RUSS',
      'SALV',
      'SDAY',
      'UNIT',
      'UR',
      'WELS',
    ],
  },
  HINDU: { description: 'Hindu', religions: ['HARE', 'HIND'] },
  JEWISH: { description: 'Jewish', religions: ['JEW'] },
  MUSLIM: { description: 'Muslim', religions: ['BLAC', 'MOS', 'SHIA', 'SUNI'] },
  NONE: { description: 'No religion', religions: ['AGNO', 'ATHE', 'NIL', 'UNKN'] },
  [OTHER_GROUP]: { description: 'Not recognised / not recorded', religions: ['NONP', RELIGION_UNKNOWN] },
  OTHER_RELIGIOUS: {
    description: 'Other',
    religions: [
      'APO',
      'BAHA',
      'DRU',
      'HUM',
      'JAIN',
      'LUTH',
      'PAG',
      'PARS',
      'RAST',
      'SATN',
      'SCIE',
      'SHIN',
      'SPIR',
      'TAO',
      'UNIF',
      'ZORO',
    ],
  },
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
    prisonersDetails.reduce(
      (accumulator, { offenderNo, religion = RELIGION_UNKNOWN }) => {
        const religiousGroup = groupsByReligion[religion] || OTHER_GROUP
        const accumulatedCount = accumulator[religiousGroup]
        accumulator[religiousGroup] = accumulatedCount + (offenderNumberToIncidentCountMap[offenderNo] || 0)
        return accumulator
      },
      R.map(() => 0, religionsByGroup)
    )
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
