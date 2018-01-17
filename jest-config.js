module.exports = {
  rootDir: 'test/',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: '<rootDir>/../coverage',
  collectCoverageFrom: ['<rootDir>/../src/**/*.js'],
  coverageThreshold: {
    global: {
      statements: 98,
      branches: 91,
      functions: 98,
      lines: 98,
    },
  },
};
