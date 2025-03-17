import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import { createStore } from 'vuex';

import PolicySummaryGraph from '@kubewarden/formatters/PolicySummaryGraph.vue';

jest.mock('@kubewarden/plugins/kubewarden-class', () => ({
  colorForStatus: jest.fn().mockImplementation((state: string) => `text-${ state }`),
  stateSort:      jest.fn().mockImplementation((textColor: string, state: string) => {
    if (state === 'pass') {
      return 2;
    } else if (state === 'fail') {
      return 1;
    }

    return 0;
  })
}));

describe('PolicySummaryGraph.vue', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore({
      getters: {},
      actions: {}
    });
  });

  function factory(propsData: any = {}) {
    return mount(PolicySummaryGraph, {
      props:  {
        row:    {},
        label:  '',
        linkTo: {},
        ...propsData
      },
      global: {
        plugins: [store],
        stubs:   {
          VDropdown: {
            template: `<div class="vdropdown">
              <slot></slot>
              <slot name="popper"></slot>
            </div>`
          },
          ProgressBarMulti: {
            name:  'ProgressBarMulti',
            props: ['values'],
            render() {
              return h('div', { class: 'progress-bar-multi' }, JSON.stringify(this.values));
            }
          },
          'router-link': {
            template: '<a class="router-link"><slot /></a>',
            props:    ['to']
          }
        }
      }
    });
  }

  it('displays a loading spinner while onMounted is fetching policies', async() => {
    let resolveFn: any;
    const row = {
      id:                 'row1',
      allRelatedPolicies: jest.fn().mockImplementation(() => new Promise((r) => {
        resolveFn = r;
      }))
    };

    const wrapper = factory({ row });

    await flushPromises();

    const spinner = wrapper.find('.icon-spinner');

    expect(spinner.exists()).toBe(true);

    resolveFn([]);
    await flushPromises();

    // The spinner should be gone after the fetch finishes
    expect(wrapper.find('.icon-spinner').exists()).toBe(false);
  });

  it('renders fallback when there are no policies (relatedPolicies is empty)', async() => {
    // Provide a row whose allRelatedPolicies returns an empty array
    const row = {
      id:                 'rowEmpty',
      allRelatedPolicies: jest.fn().mockResolvedValue([])
    };

    const wrapper = factory({ row });

    await flushPromises();

    // The fallback is the "—" inside a div with .text-center.text-muted
    const fallback = wrapper.find('div.text-center.text-muted');

    expect(fallback.exists()).toBe(true);
    expect(fallback.text()).toContain('—');

    // No progress bar
    expect(wrapper.find('.progress-bar-multi').exists()).toBe(false);
  });

  it('renders progress bar and summary if policies exist', async() => {
    const row = {
      id:                 'row1',
      allRelatedPolicies: jest.fn().mockResolvedValue([
        { status: { policyStatus: 'fail' } },
        { status: { policyStatus: 'fail' } },
        { status: { policyStatus: 'pass' } }
      ])
    };

    const wrapper = factory({ row });

    await flushPromises();

    const pieces = wrapper.findAll('.piece.bg-fail');

    expect(pieces.length).toBe(1);
    expect(pieces[0].attributes()['style']).toContain('width: 66.66%');

    // No fallback
    expect(wrapper.find('.text-center.text-muted').exists()).toBe(false);
  });

  it('shows a label plus count if the "label" prop is provided', async() => {
    const row = {
      id:                 'row1',
      allRelatedPolicies: jest.fn().mockResolvedValue([
        { status: { policyStatus: 'pass' } },
        { status: { policyStatus: 'fail' } }
      ])
    };
    const wrapper = factory({
      row,
      label: 'Hello Label'
    });

    await flushPromises();

    // The total is 2
    // The template says: if label is given => "Hello Label, 2"
    expect(wrapper.text()).toContain('Hello Label, 2');
  });

  it('shows just the count if no label is given', async() => {
    const row = {
      id:                 'row1',
      allRelatedPolicies: jest.fn().mockResolvedValue([
        { status: { policyStatus: 'pass' } }
      ])
    };

    const wrapper = factory({ row });

    await flushPromises();

    // The total is 1. So we expect just "1"
    expect(wrapper.text()).toContain('1');
    // Should not see a comma or any label text
    expect(wrapper.text()).not.toContain(',');
  });

  it('renders a <router-link> if linkTo is provided, otherwise a <span>', async() => {
    const row = {
      id:                 'rowlink',
      allRelatedPolicies: jest.fn().mockResolvedValue([{ status: { policyStatus: 'fail' } }])
    };

    // 1) Provide linkTo, expect <router-link>
    const wrapperWithLink = factory({
      row,
      label:  'Has Link',
      linkTo: { name: 'someRoute' }
    });

    await flushPromises();

    const linkEl = wrapperWithLink.find('.router-link');

    expect(linkEl.exists()).toBe(true);
    // The link text should be "Has Link, 1"
    expect(linkEl.text()).toContain('Has Link, 1');

    // 2) Provide no linkTo, expect <span>
    const wrapperNoLink = factory({
      row,
      label:  'No Link',
      linkTo: null
    });

    await flushPromises();

    // We should get a span instead
    expect(wrapperNoLink.find('.router-link').exists()).toBe(false);
    const span = wrapperNoLink.find('span');

    expect(span.text()).toBe('No Link, 1');
  });

  it('displays a table of states in the VDropdown popper when there are policies', async() => {
    const row = {
      id:                 'row2',
      allRelatedPolicies: jest.fn().mockResolvedValue([
        { status: { policyStatus: 'fail' } },
        { status: { policyStatus: 'fail' } },
        { status: { policyStatus: 'pass' } }
      ])
    };
    const wrapper = factory({ row });

    await flushPromises();

    // The popper slot is rendered in our stub, so let's find the table
    const popperTable = wrapper.find('table.fixed');

    expect(popperTable.exists()).toBe(true);

    const rows = popperTable.findAll('tbody tr');

    expect(rows.length).toBe(2); // 'fail', 'pass'

    // Check one row with "fail" and count=2
    const failRow = rows.find((r) => r.text().includes('fail'));

    expect(failRow).toBeTruthy();
    expect(failRow?.text()).toContain('2');
    // The first cell should have class "text-fail"
    const tds = failRow?.findAll('td') || [];

    expect(tds[0].classes()).toContain('text-fail');

    // Check one row with "pass" and count=1
    const passRow = rows.find((r) => r.text().includes('pass'));

    expect(passRow).toBeTruthy();
    expect(passRow?.text()).toContain('1');
  });
});
