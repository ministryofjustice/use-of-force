import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  ...hmppsConfig({
    extraPathsAllowingDevDependencies: ['**/__testutils/**'],
    extraIgnorePaths: ['integration-tests/', 'migrations/', 'assets/', '*.test.*'],
  }),
  {
    name: 'overrides',
    files: ['**/*.ts'],
    ignores: ['**/*.js'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/import/no-unresolved': 'off',
      '@typescript-eslint/import/extensions': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'global-require': 'off',
      'import/no-unresolved': 'off',
    },
  },
]
