import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';

import PolicySummaryGraph from '@kubewarden/formatters/PolicySummaryGraph.vue';

import * as kubewarden from '@kubewarden/plugins/kubewarden-class';

describe('PolicySummaryGraph.vue', () => {
  let row: any;
  let fakePolicies: any[];
  let colorForStatusSpy: jest.SpyInstance; // eslint-disable-line
  let stateSortSpy: jest.SpyInstance; // eslint-disable-line

  beforeEach(() => {
    // Stub colorForStatus: returns "text-<state>"
    colorForStatusSpy = jest.spyOn(kubewarden, 'colorForStatus')
      .mockImplementation((...args: unknown[]) => {
        const state = args[0] as string;

        return `text-${ state }`;
      });
    // Stub stateSort: for simplicity, return numeric values based on the state
    stateSortSpy = jest.spyOn(kubewarden, 'stateSort')
      .mockImplementation((...args: unknown[]) => {
        const state = args[1] as string;

        // For example: "pass" -> 2, "fail" -> 1, others 0
        if (state === 'pass') {
          return 2;
        }
        if (state === 'fail') {
          return 1;
        }

        return 0;
      });

    // Fake policies array returned by row.allRelatedPolicies()
    fakePolicies = [
      { status: { policyStatus: 'fail' } },
      { status: { policyStatus: 'fail' } },
      { status: { policyStatus: 'pass' } }
    ];

    // Fake row object with an id and an allRelatedPolicies() method
    row = {
      id:                 'row1',
      allRelatedPolicies: jest.fn().mockResolvedValue(fakePolicies)
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Factory helper to mount the component with necessary stubs
  const factory = (propsData = {}) => {
    return mount(PolicySummaryGraph, {
      props:  {
        row,
        ...propsData
      },
      global: {
        stubs: {
          // Stub VDropdown: render default and popper slots
          VDropdown: {
            template: `<div class="vdropdown">
              <slot></slot>
              <slot name="popper"></slot>
            </div>`
          },
          // Stub ProgressBarMulti: render its "values" prop as JSON for testing
          ProgressBarMulti: {
            template: '<div class="progress-bar-multi">{{ JSON.stringify(values) }}</div>',
            props:    ['values']
          },
          // Stub router-link to render an <a> element with its content
          'router-link': {
            template: '<a class="router-link"><slot /></a>',
            props:    ['to']
          }
        }
      }
    });
  };

  it('calls row.allRelatedPolicies in created() and sets relatedPolicies', async() => {
    const wrapper = factory();

    await flushPromises();

    expect((wrapper.vm as any).relatedPolicies).toEqual(fakePolicies);
  });

  it('computed "show" returns true if stateParts is non-empty', async() => {
    const wrapper = factory();

    await flushPromises();
    expect(wrapper.vm.show).toBe(true);
  });

  it('computed "show" returns false if stateParts is empty', async() => {
    const wrapper = factory();

    await flushPromises();

    await wrapper.setData({ relatedPolicies: [] });

    expect(wrapper.vm.show).toBe(false);
  });

  it('computed "stateParts" groups policies by state correctly', async() => {
    const wrapper = factory();

    await flushPromises();

    const stateParts = wrapper.vm.stateParts;

    // Expect two groups: one for "fail" (value 2) and one for "pass" (value 1)
    // Expected groups:
    // For "fail": colorForStatus returns "text-fail" → key "text-fail/fail",
    //   value should be 2, color becomes "bg-fail", sort returns 1.
    // For "pass": key "text-pass/pass", value 1, color "bg-pass", sort returns 2.
    const failGroup = stateParts.find((item: any) => item.label === 'fail');
    const passGroup = stateParts.find((item: any) => item.label === 'pass');

    expect(failGroup).toBeDefined();
    expect(failGroup.value).toBe(2);
    expect(failGroup.color).toBe('bg-fail');
    expect(failGroup.textColor).toBe('text-fail');
    expect(failGroup.sort).toBe(1);

    expect(passGroup).toBeDefined();
    expect(passGroup.value).toBe(1);
    expect(passGroup.color).toBe('bg-pass');
    expect(passGroup.textColor).toBe('text-pass');
    expect(passGroup.sort).toBe(2);
  });

  it('computed "colorParts" groups stateParts by color correctly', async() => {
    const wrapper = factory();

    await flushPromises();

    const colorParts = wrapper.vm.colorParts;
    // Expect two groups: one for "bg-fail" (value 2) and one for "bg-pass" (value 1)
    const failColor = colorParts.find((item: any) => item.color === 'bg-fail');
    const passColor = colorParts.find((item: any) => item.color === 'bg-pass');

    expect(failColor).toBeDefined();
    expect(failColor.value).toBe(2);
    expect(passColor).toBeDefined();
    expect(passColor.value).toBe(1);
  });

  it('computed "displayLabel" returns label with count when label prop is provided', async() => {
    const wrapper = factory({ label: 'Test Label' });

    await flushPromises();

    // fakePolicies.length is 3, so displayLabel should be "Test Label, 3"
    expect(wrapper.vm.displayLabel).toBe('Test Label, 3');
  });

  it('computed "displayLabel" returns count as string when no label prop is provided', async() => {
    const wrapper = factory();

    await flushPromises();

    expect(wrapper.vm.displayLabel).toBe('3');
  });

  describe('template rendering', () => {
    it('renders VDropdown with ProgressBarMulti and a router-link when linkTo prop is provided', async() => {
      const linkTo = { name: 'detail' };
      const wrapper = factory({
        label: 'Test Label',
        linkTo
      });

      await flushPromises();

      // Check that VDropdown is rendered (stubbed as element with class "vdropdown")
      expect(wrapper.find('.vdropdown').exists()).toBe(true);
      const progressBar = wrapper.find('.progress-bar-multi');

      expect(progressBar.exists()).toBe(true);
      expect(progressBar.text()).toEqual(JSON.stringify(wrapper.vm.colorParts));

      // Check that router-link is rendered with the correct "to" prop and displays displayLabel text
      const routerLink = wrapper.findComponent('.router-link') as any;

      expect(routerLink.exists()).toBe(true);
      expect(routerLink.props('to')).toEqual(linkTo);
      expect(routerLink.text()).toContain(wrapper.vm.displayLabel);
    });

    it('renders a span with displayLabel when linkTo prop is not provided', async() => {
      const wrapper = factory({ label: 'Test Label' });

      await flushPromises();

      // router-link should not exist; a span should display displayLabel
      expect(wrapper.findComponent({ name: 'router-link' }).exists()).toBe(false);
      const span = wrapper.find('span');

      expect(span.exists()).toBe(true);
      expect(span.text()).toBe(wrapper.vm.displayLabel);
    });

    it('renders fallback div when "show" is false', async() => {
      // Set relatedPolicies to empty so that stateParts (and thus show) is empty.
      const wrapper = factory({ label: 'Test Label' });

      await flushPromises();
      await wrapper.setData({ relatedPolicies: [] });

      // When show is false, the template renders a div with classes "text-center text-muted" containing an em-dash.
      const fallback = wrapper.find('div.text-center.text-muted');

      expect(fallback.exists()).toBe(true);
      expect(fallback.text()).toContain('—'); // or the &mdash; character
    });
  });
});
