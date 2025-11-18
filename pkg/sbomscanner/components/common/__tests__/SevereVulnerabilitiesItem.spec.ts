import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import SevereVulnerabilitiesItem from '../SevereVulnerabilitiesItem.vue';
import ScoreBadge from '../ScoreBadge.vue';
import BlockPercentageBar from '../BlockPercentageBar.vue';

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'test-product',
  PAGE:         { VULNERABILITIES: 'test-vulns' }
}));

describe('SevereVulnerabilitiesItem.vue', () => {
  let wrapper;

  const mockVulnerability = {
    metadata: { name: 'CVE-2025-1234' },
    spec:     {
      scoreV3:              '9.8',
      impactedImages_count: 5,
      impactedImages:       5,
      totalImages:          10
    }
  };

  const mockRoute = { params: { cluster: 'c-abcde' } };

  const mountComponent = (vulnerability) => {
    wrapper = shallowMount(SevereVulnerabilitiesItem, {
      propsData: { vulnerability: vulnerability || mockVulnerability },
      global:    {
        mocks: { $route: mockRoute },
        stubs: {
          RouterLink:         RouterLinkStub,
          ScoreBadge:         true,
          BlockPercentageBar: true
        }
      }
    });
  };

  beforeEach(() => {
    mountComponent();
  });

  it('renders the RouterLink with correct text and destination', () => {
    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('CVE-2025-1234');
    expect(link.props('to')).toBe('/c/c-abcde/test-product/test-vulns/CVE-2025-1234');
  });

  it('passes the correct props to ScoreBadge', () => {
    const badge = wrapper.findComponent(ScoreBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('score')).toBe('9.8');
    expect(badge.props('scoreType')).toBe('v3');
  });

  it('displays the impacted images count', () => {
    expect(wrapper.find('.impacted span').text()).toBe('5');
  });

  it('passes the correct percentage and event handler to BlockPercentageBar', () => {
    const bar = wrapper.findComponent(BlockPercentageBar);

    expect(bar.exists()).toBe(true);
    expect(bar.props('percentage')).toBe(50); // (5 / 10) * 100
    expect(bar.props('eventHandler')).toBe(wrapper.vm.resize);
  });

  it('calculates percentage as 0 if impactedImages is 0', () => {
    const zeroImpactVuln = {
      ...mockVulnerability,
      spec: {
        ...mockVulnerability.spec, impactedImages: 0, impactedImages_count: 0
      }
    };

    mountComponent(zeroImpactVuln);

    const bar = wrapper.findComponent(BlockPercentageBar);

    expect(bar.props('percentage')).toBe(0); // (0 / 10) * 100
  });

  it('calculates percentage as zero if totalImages is 0 and impacted > 0', () => {
    const zeroTotalVuln = {
      ...mockVulnerability,
      spec: { ...mockVulnerability.spec, totalImages: 0 }
    };

    mountComponent(zeroTotalVuln);

    const bar = wrapper.findComponent(BlockPercentageBar);

    expect(bar.props('percentage')).toBe(0);
  });

  it('calculates percentage as zero if totalImages and impacted are 0', () => {
    const zeroAllVuln = {
      ...mockVulnerability,
      spec: {
        ...mockVulnerability.spec, impactedImages: 0, totalImages: 0
      }
    };

    mountComponent(zeroAllVuln);

    const bar = wrapper.findComponent(BlockPercentageBar);

    expect(bar.props('percentage')).toBe(0);
  });
});
