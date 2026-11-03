import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  setupFilesAfterEnv:     ['./jest.setup.ts'],
  testEnvironment:        'jest-environment-jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  modulePaths:            ['<rootDir>'],
  moduleFileExtensions:   ['js', 'mjs', 'json', 'vue', 'ts', 'tsx'],
  moduleNameMapper:       {
    '^~/(.*)$':    '<rootDir>/$1',
    '^~~/(.*)$':   '<rootDir>/$1',
    '^@/(.*)$':    '<rootDir>/$1',
    '@shell/(.*)': '<rootDir>/node_modules/@rancher/shell/$1',
    '@components/(.*)':
      '<rootDir>/node_modules/@rancher/components/dist/@rancher/components.common.js',
    '@kubewarden/(.*)':     '<rootDir>/pkg/kubewarden/$1',
    '@tests/(.*)':          '<rootDir>/tests/$1',
    // clipboard-polyfill's package `exports` only declares an `import` (ESM) condition, so Jest's
    // exports-aware resolver cannot resolve it for a CJS require. Map it to its concrete ESM build,
    // which is transformed via transformIgnorePatterns below.
    '^clipboard-polyfill$': '<rootDir>/node_modules/clipboard-polyfill/dist/es6/clipboard-polyfill.es6.js',
  },
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest',
    '^.+\\.mjs$':  '<rootDir>/node_modules/babel-jest',
    '.*\\.vue$':   '<rootDir>/node_modules/@vue/vue3-jest',
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    '^.+\\.svg$':  '<rootDir>/tests/unit/config/svgTransform.ts' // to mock `*.svg` files
  },
  // These @rancher/shell dependencies are ESM-only, so Jest has to transpile them rather than
  // ignore them like the rest of node_modules. Mirrors rancher/dashboard's own jest.config.js.
  transformIgnorePatterns: [
    '/node_modules/(?!(@vue|@rancher|jsonpath-plus|color|color-string|color-convert|color-name|vee-validate|@vee-validate|clipboard-polyfill|intl-messageformat|@formatjs|@replit/codemirror-vim-core)/)',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/',
    '<rootDir>/assets/',
    '<rootDir>/charts/',
    '<rootDir>/extensions/',
    '<rootDir>/tests/e2e/',
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['json', 'text-summary'],
  coverageProvider:  'v8',
  preset:            'ts-jest',
};

export default config;
