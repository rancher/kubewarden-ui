import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import CveNameLink from '../CveNameLink.vue';

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { VULNERABILITIES: 'mocked-vulns-page' }
}));

describe('CveNameLink.vue', () => {
  it('should render a link with the correct text and "to" prop', () => {
    const mockValue = 'CVE-2025-12345';
    const mockClusterId = 'c-m-xyz123';
    const mockRow = { id: 'r-123', name: 'some-row' };

    const wrapper = shallowMount(CveNameLink, {
      propsData: {
        value: mockValue,
        row:   mockRow
      },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub }
      }
    });

    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);

    expect(linkStub.text()).toBe(mockValue);

    const expectedUrl = `/c/${ mockClusterId }/mocked-product/mocked-vulns-page/${ mockValue }`;

    expect(linkStub.props('to')).toBe(expectedUrl);
  });
});
