import { config } from '@vue/test-utils';
import { directiveSsr as t } from '@shell/plugins/i18n';
import { VCleanTooltip } from '@shell/plugins/clean-tooltip-directive';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

import Vue from 'vue';

Vue.config.productionTip = false;

Vue.directive('clean-tooltip', VCleanTooltip);
Vue.directive('clean-html', cleanHtmlDirective);

beforeAll(() => {});

beforeEach(() => {
  jest.restoreAllMocks();

  config.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };
  config.directives = { t };
});

afterEach(() => {});

afterAll(() => {});
