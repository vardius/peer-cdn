module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js}',
    '!src/**/*.test.{js,jsx}',
  ],
  moduleDirectories: [
    'node_modules',
    'src',
  ],
  testRegex: 'test/.*\\.spec\\.js$',
};
