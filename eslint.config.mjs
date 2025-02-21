import globals from 'globals';
import jest from 'eslint-plugin-jest';
import pluginVue from 'eslint-plugin-vue';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default [
  {
    name:  'app/files-to-lint',
    files: ['**/*.{js,ts,mts,tsx,vue}', '**/*.spec.js', '**/*.test.js'],
  },

  {
    name:    'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**', 'yarn.lock', '**/tests/e2e/**'],
  },

  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  skipFormatting,

  {
    languageOptions: {
      globals: {
        ...Object.fromEntries(Object.entries(globals.browser).map(([key, value]) => [key.trim(), value])),
        ...Object.fromEntries(Object.entries(globals.node).map(([key, value]) => [key.trim(), value])),
        ...jest.environments.globals.globals
      }
    },
    rules:   {
      '@typescript-eslint/no-explicit-any':    'off',
      '@typescript-eslint/no-require-imports': 'off',

      'vue/no-multiple-template-root':  'off',
      'dot-notation':                   'off',
      'guard-for-in':                   'off',
      'new-cap':                        'off',
      'no-empty':                       'off',
      'no-extra-boolean-cast':          'off',
      'no-new':                         'off',
      'no-plusplus':                    'off',
      'no-useless-escape':              'off',
      'strict':                         'off',
      'vue/html-self-closing':          'off',
      'vue/no-v-html':                  'off',
      'vue/multi-word-component-names': 'off',

      'space-in-parens':                   'warn',
      'array-bracket-spacing':             'warn',
      'arrow-parens':                      'warn',
      'arrow-spacing':                     ['warn', {
        'before': true,
        'after':  true
      }],
      'block-spacing':                     ['warn', 'always'],
      'brace-style':                       ['warn', '1tbs'],
      'comma-dangle':                      ['warn', 'only-multiline'],
      'comma-spacing':                     'warn',
      'curly':                             'warn',
      'eqeqeq':                            'warn',
      'func-call-spacing':                 ['warn', 'never'],
      'implicit-arrow-linebreak':          'warn',
      'indent':                            ['warn', 2],
      'keyword-spacing':                   'warn',
      'lines-between-class-members':       ['warn', 'always', { 'exceptAfterSingleLine': true }],
      'multiline-ternary':                 ['warn', 'never'],
      'newline-per-chained-call':          ['warn', { 'ignoreChainWithDepth': 4 }],
      'no-caller':                         'warn',
      'no-cond-assign':                    ['warn', 'except-parens'],
      'no-console':                        'off',
      'no-debugger':                       'warn',
      'no-eq-null':                        'warn',
      'no-eval':                           'warn',
      'no-trailing-spaces':                'warn',
      'no-undef':                          'warn',
      'no-unused-vars':                    'warn',
      'no-whitespace-before-property':     'warn',
      'object-curly-spacing':              ['warn', 'always'],
      'object-property-newline':           'warn',
      'object-shorthand':                  'warn',
      'padded-blocks':                     ['warn', 'never'],
      'prefer-arrow-callback':             'warn',
      'prefer-template':                   'warn',
      'rest-spread-spacing':               'warn',
      'semi':                              ['warn', 'always'],
      'space-before-function-paren':       ['warn', 'never'],
      'space-infix-ops':                   'warn',
      'spaced-comment':                    'warn',
      'switch-colon-spacing':              'warn',
      'template-curly-spacing':            ['warn', 'always'],
      'yield-star-spacing':                ['warn', 'both'],

      'key-spacing':              ['warn', {
        'align': {
          'beforeColon': false,
          'afterColon':  true,
          'on':          'value',
          'mode':        'minimum'
        },
        'multiLine': {
          'beforeColon': false,
          'afterColon':  true
        },
      }],

      'object-curly-newline':          ['warn', {
        'ObjectExpression':  {
          'multiline':     true,
          'minProperties': 3
        },
        'ObjectPattern':     {
          'multiline':     true,
          'minProperties': 4
        },
        'ImportDeclaration': {
          'multiline':     true,
          'minProperties': 5
        },
        'ExportDeclaration': {
          'multiline':     true,
          'minProperties': 3
        }
      }],

      'padding-line-between-statements': [
        'warn',
        {
          'blankLine': 'always',
          'prev':      '*',
          'next':      'return',
        },
        {
          'blankLine': 'always',
          'prev':      'function',
          'next':      'function',
        },
        // This configuration would require blank lines after every sequence of variable declarations
        {
          'blankLine': 'always',
          'prev':      ['const', 'let', 'var'],
          'next':      '*'
        },
        {
          'blankLine': 'any',
          'prev':      ['const', 'let', 'var'],
          'next':      ['const', 'let', 'var']
        }
      ],

      'quotes': [
        'warn',
        'single',
        {
          'avoidEscape':           true,
          'allowTemplateLiterals': true
        },
      ],

      'space-unary-ops': [
        'warn',
        {
          'words':    true,
          'nonwords': false,
        }
      ]
    }
  }
];
