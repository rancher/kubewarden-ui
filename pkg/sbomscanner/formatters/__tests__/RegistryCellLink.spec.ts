import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import RegistryCellLink from '../RegistryCellLink.vue';

jest.mock('@pkg/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { REGISTRIES: 'mocked-registries-page' }
}));

describe('RegistryCellLink.vue', () => {
  it('should render a link with the correct text and "to" prop', () => {
    const mockValue = 'my-registry';
    const mockRow = { metadata: { namespace: 'my-namespace' } };
    const mockClusterId = 'c-m-xyz123';

    const wrapper = shallowMount(RegistryCellLink, {
      props: {
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

    const expectedText = 'my-namespace/my-registry';

    expect(linkStub.text()).toBe(expectedText);

    const expectedUrl = `/c/${ mockClusterId }/mocked-product/mocked-registries-page/my-namespace/my-registry`;

    expect(linkStub.props('to')).toBe(expectedUrl);
  });
});
