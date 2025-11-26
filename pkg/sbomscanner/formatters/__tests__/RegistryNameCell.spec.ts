import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import RegistryNameCell from '../RegistryNameCell.vue';

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { REGISTRIES: 'mocked-registries-page' }
}));

describe('RegistryNameCell.vue', () => {
  it('should render a link with the correct text and "to" prop', () => {
    const mockRow = {
      metadata: {
        name:      'my-test-registry',
        namespace: 'my-test-namespace'
      }
    };
    const mockClusterId = 'c-m-abc123';

    const wrapper = shallowMount(RegistryNameCell, {
      props:  { row: mockRow },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub }
      }
    });

    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);

    const expectedText = 'my-test-registry';

    expect(linkStub.text()).toBe(expectedText);

    const expectedUrl = `/c/${ mockClusterId }/mocked-product/mocked-registries-page/my-test-namespace/my-test-registry`;

    expect(linkStub.props('to')).toBe(expectedUrl);
  });
});
