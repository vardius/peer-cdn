module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js}',
    '!src/**/*.test.{js,jsx}',
  ],
  coverageThreshold: {
    global: {
      statements: 98,
      branches: 91,
      functions: 98,
      lines: 98,
    },
  },
  moduleDirectories: [
    'node_modules',
    'src',
  ],
  testRegex: 'test/.*\\.spec\\.js$',
};
