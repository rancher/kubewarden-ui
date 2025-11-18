import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import RegistryStatusUpdate from '../RegistryStatusUpdate.vue';
import StatusBadge from '../StatusBadge.vue';
import { elapsedTime } from '@shell/utils/time';

jest.mock('@shell/utils/time', () => ({ elapsedTime: jest.fn() }));

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'test-product',
  PAGE:         { REGISTRIES: 'test-registries' },
}));

const mockElapsedTime = elapsedTime as jest.Mock;

describe('RegistryStatusUpdate.vue', () => {
  const mockStatus = {
    registryName:       'my-registry',
    namespace:          'default',
    uri:                'docker.io/my-registry',
    prevScanStatus:     'Success',
    currStatus:         'Failed',
    lastTransitionTime: '2023-01-01T00:00:00Z',
  };

  const mockRoute = { params: { cluster: 'c-12345' } };

  const mockT = (key: string) => (key === 'imageScanner.general.ago' ? 'ago' : key);
  let dateNowSpy;

  beforeEach(() => {
    mockElapsedTime.mockClear();
    mockElapsedTime.mockReturnValue({ label: '5 minutes' });
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date('2023-01-01T00:05:00Z').getTime());
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('when registryStatus has data', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallowMount(RegistryStatusUpdate, {
        propsData: { registryStatus: mockStatus },
        global:    {
          stubs: {
            // --- FIX: Stub StatusBadge with `true`, not the component import ---
            StatusBadge: true,
            RouterLink:  RouterLinkStub
          },
          mocks: { $route: mockRoute, t: mockT }
        }
      });
    });

    it('renders the registry name as a RouterLink', () => {
      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);
      expect(link.text()).toBe('my-registry');
      expect(link.props('to')).toBe('/c/c-12345/test-product/test-registries/default/my-registry');
    });

    it('renders the registry URI', () => {
      expect(wrapper.find('.uri').text()).toBe(mockStatus.uri);
    });

    it('renders two StatusBadge components', () => {
      // This will find <status-badge-stub> components
      const badges = wrapper.findAllComponents(StatusBadge);

      expect(badges.length).toBe(2);
    });

    it('passes the correct statuses to the StatusBadges', () => {
      const badges = wrapper.findAllComponents(StatusBadge);

      // We can still check props on the stubs
      expect(badges.at(0).props('status')).toBe(mockStatus.prevScanStatus);
      expect(badges.at(1).props('status')).toBe(mockStatus.currStatus);
    });

    it('renders the arrow', () => {
      expect(wrapper.find('.arrow').text()).toBe('>');
    });

    it('renders the formatted update time', () => {
      const now = Math.ceil(new Date('2023-01-01T00:05:00Z').getTime() / 1000);
      const then = Math.ceil(new Date(mockStatus.lastTransitionTime).getTime() / 1000);
      const diff = now - then;

      expect(mockElapsedTime).toHaveBeenCalledWith(diff);
      expect(wrapper.find('.update-time').text()).toBe('5 minutes ago');
    });

    it('does not render the no-data element', () => {
      expect(wrapper.find('.no-data').exists()).toBe(false);
    });
  });

  describe('when registryStatus is empty', () => {
    let wrapper;

    beforeEach(() => {
      const emptyStatus = { registryName: null };

      wrapper = shallowMount(RegistryStatusUpdate, {
        propsData: { registryStatus: emptyStatus },
        global:    {
          stubs: {
            StatusBadge: true,
            RouterLink:  RouterLinkStub
          },
          mocks: { $route: mockRoute, t: mockT }
        }
      });
    });

    it('renders the no-data element', () => {
      expect(wrapper.find('.no-data').exists()).toBe(true);
    });

    it('does not render the registry name link', () => {
      expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
    });

    it('does not render the uri', () => {
      expect(wrapper.find('.uri').exists()).toBe(false);
    });

    it('does not render any StatusBadges', () => {
      expect(wrapper.findAllComponents(StatusBadge).length).toBe(0);
    });

    it('does not render the update time', () => {
      expect(wrapper.find('.update-time').exists()).toBe(false);
    });
  });
});