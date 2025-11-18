import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import ImageNameCell from '../ImageNameCell.vue'; // Adjust this path as needed

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { IMAGES: 'mocked-images-page' }
}));

describe('ImageNameCell.vue', () => {
  const mockClusterId = 'c-m-xyz123';

  const mountComponent = (row) => {
    return shallowMount(ImageNameCell, {
      props:  { row },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
  };

  it('should render a link with the correct display name and URL', () => {
    const mockRow = {
      metadata:      { name: 'my-image-resource-name' },
      imageMetadata: {
        registryURI: 'docker.io',
        repository:  'my-repo/my-app',
        tag:         'v1.0.0'
      }
    };
    const expectedDisplayName = 'docker.io/my-repo/my-app:v1.0.0';
    const expectedUrl = `/c/${ mockClusterId }/mocked-product/mocked-images-page/my-image-resource-name`;

    const wrapper = mountComponent(mockRow);
    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);
    expect(linkStub.text()).toBe(expectedDisplayName);
    expect(linkStub.props('to')).toBe(expectedUrl);
  });

  it('should handle missing imageMetadata gracefully', () => {
    const mockRow = { metadata: { name: 'my-image-resource-name-2' } };

    const expectedDisplayName = '';
    const expectedUrl = `/c/${ mockClusterId }/mocked-product/mocked-images-page/my-image-resource-name-2`;

    const wrapper = mountComponent(mockRow);
    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);
    expect(linkStub.text()).toBe(expectedDisplayName);
    expect(linkStub.props('to')).toBe(expectedUrl);
  });
});
