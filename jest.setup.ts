import { createApp } from 'vue';
import { config } from '@vue/test-utils';
import { beforeAll, beforeEach } from '@jest/globals';
import FloatingVue from 'floating-vue';
import vSelect from 'vue-select';
import { TextEncoder } from 'util';

import i18n from '@shell/plugins/i18n';
import { floatingVueOptions } from '@shell/plugins/floating-vue';
import cleanTooltipDirective from '@shell/directives/clean-tooltip';
import cleanHtmlDirective from '@shell/directives/clean-html';
import trimWhitespaceDirective from '@shell/directives/trim-whitespace';
import '@shell/plugins/replaceall';

// Create a Vue application instance
const vueApp = createApp({});

// Set up global TextEncoder
global.TextEncoder = TextEncoder;

// Configure Vue plugins, directives, and components
vueApp.use(i18n, { store: { dispatch() {} } });
vueApp.use(FloatingVue, floatingVueOptions);
vueApp.directive('clean-html', cleanHtmlDirective);
vueApp.directive('clean-tooltip', cleanTooltipDirective);
vueApp.directive('trim-whitespace', trimWhitespaceDirective);
vueApp.component('v-select', vSelect);

// Extend global config for @vue/test-utils
config.global.components = {
  ...config.global.components,
  'v-select': vSelect,
};
config.global.plugins = [FloatingVue];
config.global.mocks = {
  ...config.global.mocks,
  t:      (key: string) => `%${ key }%`,
  $store: {
    getters:  {},
    dispatch: jest.fn(),
    commit:   jest.fn(),
  },
};
config.global.directives = {
  ...config.global.directives,
  t: {
    mounted(el: HTMLElement, binding: { value: string }) {
      el.textContent = `%${ binding.value }%`;
    },
    updated(el: HTMLElement, binding: { value: string }) {
      el.textContent = `%${ binding.value }%`;
    },
  },
  'clean-tooltip':   cleanTooltipDirective,
  'clean-html':      cleanHtmlDirective,
  'trim-whitespace': trimWhitespaceDirective,
};
config.global.stubs = {
  ...config.global.stubs,
  t: { template: '<span><slot /></span>' },
};

// Global mocks for matchMedia and canvas getContext
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', { value: jest.fn().mockImplementation(() => ({ addListener: jest.fn() })) });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: jest.fn().mockImplementation(() => ({
      createLinearGradient: jest.fn(),
      fillRect:             jest.fn(),
      getImageData:         jest.fn(() => ({ data: [] })),
    })),
  });
});

// Reset mocks before each test
beforeEach(() => {
  jest.restoreAllMocks();
  config.global.mocks = {
    ...config.global.mocks,
    $store: { getters: { 'i18n/t': jest.fn() } },
  };
});
