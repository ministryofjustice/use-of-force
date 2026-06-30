import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['assets'],
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs'],
})
