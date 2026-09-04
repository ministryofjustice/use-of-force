// Tests that need a real Postgres, kept out of `npm test`.
//
// The root jest config in package.json matches only server/ and job/, so a database-backed test placed
// there would run in `npm test` and in CI's node_unit_tests job, where there is no database, and go red.
// Run these with `npm run schema:verify` / `npm run schema:reference-data` against the
// docker-compose-schema-spy.yml database.
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/*.test.ts'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', { isolatedModules: true, tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['js', 'json', 'node', 'ts'],
  testTimeout: 30000,
}
