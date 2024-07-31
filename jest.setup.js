import Vue from 'vue';
import { config } from '@vue/test-utils';
import i18n from '@shell/plugins/i18n';
import cleanTooltipDirective from '@shell/directives/clean-tooltip';
import cleanHtmlDirective from '@shell/directives/clean-html';

Vue.config.productionTip = false;

Vue.use(i18n);
Vue.directive('clean-tooltip', cleanTooltipDirective);
Vue.directive('clean-html', cleanHtmlDirective);

beforeAll(() => {});

beforeEach(() => {
  jest.restoreAllMocks();

  config.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };
});

afterEach(() => {});

afterAll(() => {});
