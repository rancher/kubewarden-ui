import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick } from 'vue';

import PolicyReportSummary from '@kubewarden/formatters/PolicyReportSummary.vue';

jest.mock('@kubewarden/modules/policyReporter', () => ({ colorForResult: (result: string) => `text-${ result }` }));

describe('PolicyReportSummary.vue', () => {
  let store: ReturnType<typeof createStore>;
  let getters: Record<string, any>;

  beforeEach(() => {
    getters = {
      'kubewarden/loadingReports':      () => false,
      'kubewarden/summaryByResourceId': () => () => ({})
    };

    store = createStore({ getters });
  });

  const factory = (propsData = {}) => {
    return mount(PolicyReportSummary, {
      props:  propsData,
      global: {
        plugins: [store],
        stubs:   {
          VDropdown:         { template: `<div><slot></slot><slot name="popper"></slot></div>` },
          'v-clean-tooltip': true
        }
      }
    });
  };

  it('displays a loading spinner when loadingReports is true', () => {
    getters['kubewarden/loadingReports'] = () => true;
    store = createStore({ getters });

    const wrapper = mount(PolicyReportSummary, {
      props:  { value: { id: 'resource1' } },
      global: {
        plugins: [store],
        stubs:   {
          VDropdown:         true,
          'v-clean-tooltip': true
        }
      }
    });

    expect(wrapper.find('[data-testid="resource-tab-loading"]').exists()).toBe(true);
  });

  it('displays "-" when not loading and summary is empty', async() => {
    getters['kubewarden/loadingReports'] = () => false;
    getters['kubewarden/summaryByResourceId'] = () => () => ({});
    store = createStore({ getters });

    const wrapper = factory({ value: { id: 'resource1' } });

    await nextTick();

    // Since there is no summary data, the fallback "-" should be rendered.
    expect(wrapper.text()).toContain('-');
  });

  it('displays summary badges when summary is non-empty', async() => {
    // Provide summary data with truthy counts.
    const summaryData = {
      fail:  2,
      pass:  5,
      error: 0
    }; // error is zero so it’s falsy

    getters['kubewarden/loadingReports'] = () => false;
    getters['kubewarden/summaryByResourceId'] = () => () => summaryData;
    store = createStore({ getters });

    const wrapper = factory({ value: { id: 'resource1' } });

    await nextTick();

    // The component renders summary badges only when canShow is true.
    // It loops over computed summaryParts and shows badges for values that exist.
    const badges = wrapper.findAll('.badge');

    // Expect two badges: one for "fail" (value 2) and one for "pass" (value 5)
    expect(badges.length).toBe(2);

    // Check that one badge displays the count 2 and the other count 5.
    const badgeTexts = badges.map((badge) => badge.text());

    expect(badgeTexts.some((text) => text.includes('2'))).toBe(true);
    expect(badgeTexts.some((text) => text.includes('5'))).toBe(true);
  });
});
