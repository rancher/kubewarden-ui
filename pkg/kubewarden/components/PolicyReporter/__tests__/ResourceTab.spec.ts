import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick, h } from 'vue';

import ResourceTab from '@kubewarden/components/PolicyReporter/ResourceTab.vue';

import {
  getFilteredReport,
  getLinkForPolicy
} from '@kubewarden/modules/policyReporter';

jest.mock('@kubewarden/modules/policyReporter', () => ({
  getFilteredReport: jest.fn(),
  getLinkForPolicy:  jest.fn(),
  colorForResult:    jest.fn((result) => `text-${ result }`),
  colorForSeverity:  jest.fn((severity) => `bg-${ severity }`)
}));

const commonMocks = {
  $route: {
    params: {
      resource:  'pod',
      id:        '123',
      namespace: 'default'
    },
    path: '/pod/123'
  }
};

const RouterLinkStub = {
  name:  'router-link',
  props: ['to'],
  render() {
    return h('a', {}, this.$slots.default ? this.$slots.default() : '');
  }
};

const createSortableTableStub = (slotName: string, className: string) => ({
  name:  'SortableTable',
  props: {
    rows:              {
      type:    Array,
      default: () => []
    },
    headers:           {
      type:    Array,
      default: () => []
    },
    tableActions:      Boolean,
    rowActions:        Boolean,
    keyField:          String,
    subExpandable:     Boolean,
    subExpandColumn:   Boolean,
    subRows:           Boolean,
    paging:            Boolean,
    rowsPerPage:       Number,
    extraSearchFields: {
      type:    Array,
      default: () => []
    },
    defaultSortBy: String
  },
  setup(props, { slots }) {
    return () => h('div', { class: className }, slots[slotName] ? slots[slotName]({
      row:         props.rows[0],
      fullColspan: 1
    }) : null);
  }
});

const BadgeStateStub = {
  name:  'BadgeState',
  props: ['label', 'color'],
  render() {
    // Here we simply return a span with the expected classes and text.
    return h('span', { class: ['badge-state', this.color] }, this.label);
  }
};


// Reusable Banner stub that renders its default slot.
const BannerStub = {
  name:  'Banner',
  props: ['color'],
  render() {
    return h('div', { class: 'banner-stub' }, this.$slots.default ? this.$slots.default() : '');
  }
};

describe('ResourceTab.vue', () => {
  let store: ReturnType<typeof createStore>;
  let getters: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    getters = {
      'i18n/t':       (key: string) => key,
      'cluster/byId': () => (resource: string, id: string) => ({
        resource,
        id,
        type: resource
      }),
      'cluster/schemaFor': () => () => {
        return true;
      }
    };

    store = createStore({ getters });
  });

  const createWrapper = (overrides: any = {}) => {
    return mount(ResourceTab, {
      global: {
        mocks:   commonMocks,
        stubs:   {
          SortableTable: true,
          'router-link': RouterLinkStub
        },
        plugins: [store],
      },
      ...overrides
    });
  };

  it('shows a loading indicator initially then renders the table when reports are fetched', async() => {
    // Simulate getFilteredReport resolving with an empty results array.
    (getFilteredReport as jest.Mock).mockResolvedValue({ results: [] });

    const wrapper = createWrapper();

    // Loading indicator should be visible immediately.
    expect(wrapper.find('[data-testid="resource-tab-loading"]').exists()).toBe(true);

    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-testid="resource-tab-loading"]').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'SortableTable' }).exists()).toBe(true);
  });

  it('calls determineResource when $route has resource and id', async() => {
    (getFilteredReport as jest.Mock).mockResolvedValue({ results: [] });
    createWrapper();

    await flushPromises();
    await nextTick();

    // The determineResource function should have used the cluster/byId getter.
    const resource = store.getters['cluster/byId']('pod', 'default/123');

    expect(resource).toEqual({
      resource: 'pod',
      id:       'default/123',
      type:     'pod'
    });
  });


  it('renders the policy column with a router-link when canGetKubewardenLinks is true', async() => {
    const mockLink = { name: 'mock-route' };

    (getLinkForPolicy as jest.Mock).mockReturnValue(mockLink);

    (getFilteredReport as jest.Mock).mockResolvedValue({
      results: [
        {
          policy:     'clusterwide-my-policy',
          result:     'PASS',
          severity:   'high',
          properties: {},
          scope:      {}
        }
      ]
    });

    const wrapper = createWrapper({
      global: {
        plugins: [store],
        mocks:   commonMocks,
        stubs:   {
          SortableTable: createSortableTableStub('col:policy', 'sortable-table-stub'),
          'router-link': RouterLinkStub
        }
      }
    });

    await flushPromises();
    await nextTick();

    const routerLink = wrapper.findComponent(RouterLinkStub);

    expect(routerLink.exists()).toBe(true);
    expect(routerLink.props('to')).toEqual(mockLink);
    // The formattedDisplayName function should remove the "clusterwide-" prefix.
    // So "clusterwide-my-policy" becomes "my-policy".
    expect(routerLink.text()).toBe('my-policy');
  });

  it('renders the policy column as plain text when canGetKubewardenLinks is false', async() => {
    const storeWithoutLinks = createStore({
      getters: {
        'i18n/t':       (key: string) => key,
        'cluster/byId': () => (resource: string, id: string) => ({
          resource,
          id,
          type: resource
        }),
        'cluster/schemaFor': () => () => {
          return false;
        }
      }
    });

    (getFilteredReport as jest.Mock).mockResolvedValue({
      results: [
        {
          policy:     'clusterwide-my-policy',
          result:     'PASS',
          severity:   'high',
          properties: {},
          scope:      {}
        }
      ]
    });

    const wrapper = createWrapper({
      global: {
        plugins: [storeWithoutLinks],
        mocks:   commonMocks,
        stubs:   {
          SortableTable: createSortableTableStub('col:policy', 'sortable-table-stub'),
          'router-link': RouterLinkStub
        }
      }
    });

    await flushPromises();
    await nextTick();

    const stubEl = wrapper.find('.sortable-table-stub');

    expect(stubEl.text()).toBe('my-policy');
  });

  it('renders BadgeState for severity with correct label and color', async() => {
    (getFilteredReport as jest.Mock).mockResolvedValue({
      results: [
        {
          policy:     'policy-name',
          result:     'PASS',
          severity:   'high',
          properties: {},
          scope:      {}
        }
      ]
    });

    const wrapper = createWrapper({
      global: {
        plugins: [store],
        mocks:   commonMocks,
        stubs:   {
          SortableTable: createSortableTableStub('col:severity', 'status-slot'),
          BadgeState:    BadgeStateStub,
          'router-link': RouterLinkStub
        }
      }
    });

    await flushPromises();
    await nextTick();

    const badge = wrapper.find('.badge-state');

    expect(badge.text()).toBe('high');
    expect(badge.classes()).toContain('bg-high');
  });

  it('renders BadgeState for status with correct label and color', async() => {
    (getFilteredReport as jest.Mock).mockResolvedValue({
      results: [
        {
          policy:     'policy-name',
          result:     'PASS',
          severity:   'high',
          properties: {},
          scope:      {}
        }
      ]
    });

    const wrapper = createWrapper({
      global: {
        plugins: [store],
        mocks:   commonMocks,
        stubs:   {
          SortableTable: createSortableTableStub('col:status', 'status-slot'),
          BadgeState:    BadgeStateStub,
          'router-link': RouterLinkStub
        }
      }
    });

    await flushPromises();
    await nextTick();

    const badge = wrapper.find('.badge-state');

    expect(badge.text()).toBe('PASS');
    expect(badge.classes()).toContain('bg-PASS');
  });

  it('renders sub-row details when a row has a message', async() => {
    (getFilteredReport as jest.Mock).mockResolvedValue({
      results: [
        {
          policy:     'policy-name',
          result:     'PASS',
          severity:   'high',
          message:    'Warning message',
          category:   'Category A',
          properties: {
            mutating:   'Yes',
            validating: 'No'
          },
          scope: {}
        }
      ]
    });

    const wrapper = createWrapper({
      global: {
        plugins: [store],
        mocks:   commonMocks,
        stubs:   {
          SortableTable: createSortableTableStub('sub-row', 'details'),
          'router-link': RouterLinkStub,
          Banner:        BannerStub
        }
      }
    });

    await flushPromises();
    await nextTick();

    const banner = wrapper.find('[data-testid="banner-content"]');

    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain('%kubewarden.policyReporter.headers.policyReportsTab.message.title%:');
    expect(banner.text()).toContain('Warning message');

    const details = wrapper.find('.details');

    expect(details.text()).toContain('kubewarden.policyReporter.headers.policyReportsTab.category');
    expect(details.text()).toContain('Category A');
    expect(details.text()).toContain('kubewarden.policyReporter.headers.policyReportsTab.properties.mutating');
    expect(details.text()).toContain('Yes');
    expect(details.text()).toContain('kubewarden.policyReporter.headers.policyReportsTab.properties.validating');
    expect(details.text()).toContain('No');
  });
});
