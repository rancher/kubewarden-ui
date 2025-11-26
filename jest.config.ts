import type { Config } from '@jest/types';

let project = '';
const arg = process.argv.find((arg) => arg.startsWith('--project='));

if (arg) {
  project = arg.split('=')[1];
}

if (!project) {
  project = 'kubewarden';
}

const config: Config.InitialOptions = {
  setupFilesAfterEnv:     ['./jest.setup.ts'],
  testEnvironment:        'jest-environment-jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  testMatch:              [`<rootDir>/pkg/${ project }/**/*.spec.[jt]s?(x)`],
  modulePaths:            ['<rootDir>'],
  moduleFileExtensions:   ['js', 'json', 'vue', 'ts', 'tsx'],
  moduleNameMapper:       {
    '^~/(.*)$':    '<rootDir>/$1',
    '^~~/(.*)$':   '<rootDir>/$1',
    '^@/(.*)$':    '<rootDir>/$1',
    '@shell/(.*)': '<rootDir>/node_modules/@rancher/shell/$1',
    '@components/(.*)':
      '<rootDir>/node_modules/@rancher/components/dist/@rancher/components.common.js',
    '@kubewarden/(.*)':  '<rootDir>/pkg/kubewarden/$1',
    '@sbomscanner/(.*)': '<rootDir>/pkg/sbomscanner/$1',
    '@tests/(.*)':       '<rootDir>/tests/$1',
  },
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest',
    '.*\\.vue$':   '<rootDir>/node_modules/@vue/vue3-jest',
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    '^.+\\.svg$':  '<rootDir>/tests/unit/config/svgTransform.ts' // to mock `*.svg` files
  },
  transformIgnorePatterns:  ['/node_modules/(?!(@vue|@rancher|jsonpath-plus))'],
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/',
    '<rootDir>/assets/',
    '<rootDir>/charts/',
    '<rootDir>/extensions/',
    '<rootDir>/tests/e2e/',
  ],
  coverageDirectory: `<rootDir>/coverage/unit/${ project }`,
  coverageReporters: ['json', 'text-summary'],
  coverageProvider:  'v8',
  preset:            'ts-jest',
};

export default config;