import { config } from '@vue/test-utils';
import { directiveSsr as t } from '@shell/plugins/i18n';

import Vue from 'vue';

Vue.config.productionTip = false;

beforeAll(() => {});

beforeEach(() => {
  jest.restoreAllMocks();

  config.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };
  config.directives = { t };
});

afterEach(() => {});

afterAll(() => {});
