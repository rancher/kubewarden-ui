/* eslint-env node */
module.exports = {
  ignorePatterns: ['playwright-report/', 'test-results/'],
  overrides:      [
    {
      files:   ['./e2e/**/*.ts', './*.ts'],
      extends: [
        'standard',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // 'plugin:prettier/recommended'
      ],
      plugins: ['@typescript-eslint'],
      parser:  '@typescript-eslint/parser',
      rules:   {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any':                'off',
        'padding-line-between-statements':                   'off',
        'comma-dangle':                                      ['error', 'only-multiline'],
        'space-before-function-paren':                       ['error', 'never'],
        'key-spacing':                                       ['error', { align: { mode: 'minimum' } }],
      }
    }
  ]
};
