import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    extraIgnorePaths: ['integration-tests/', 'migrations/', 'assets/**', 'esbuild/**'],
  }),
  {
    rules: {
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      'global-require': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
