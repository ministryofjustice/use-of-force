import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'


export default [
  ...hmppsConfig({
    extraPathsAllowingDevDependencies: ['**/__testutils/**'],
    extraIgnorePaths: ['integration-tests/', 'migrations/', 'assets/', '*.test.*'] 
  }),
  {
    rules: {
      'no-param-reassign': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'import/no-cycle': 'off',
      'max-classes-per-file': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      'import/no-unresolved': 'off',
      'import/extensions': 'off', 
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: 'res|next|^err|_',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
]