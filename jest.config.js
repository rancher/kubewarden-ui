module.exports = {
  setupFilesAfterEnv:   ['./jest.setup.js'],
  modulePaths:          ['<rootDir>'],
  moduleFileExtensions: ['js', 'json', 'vue', 'ts', 'tsx'],
  moduleNameMapper:     {
    '^~/(.*)$':         '<rootDir>/$1',
    '^~~/(.*)$':        '<rootDir>/$1',
    '^@/(.*)$':         '<rootDir>/$1',
    '@shell/(.*)':      '<rootDir>/node_modules/@rancher/shell/$1',
    '@components/(.*)': '<rootDir>/node_modules/@rancher/components/dist/@rancher/components.common.js',
    '@kubewarden/(.*)': '<rootDir>/pkg/kubewarden/$1',
    '@tests/(.*)':      '<rootDir>/tests/$1'
  },
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest',
    '.*\\.(vue)$': '<rootDir>/node_modules/@vue/vue2-jest',
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  transformIgnorePatterns:  ['/node_modules/(?!(@vue|@rancher|jsonpath-plus))'],
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/',
    '<rootDir>/assets/',
    '<rootDir>/charts/',
    '<rootDir>/extensions/',
    '<rootDir>/tests/tests/',
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['json', 'text-summary'],
  preset:            '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  testEnvironment:   './tests/unit/_config_/FixJSDOMEnvironment.ts',
};
