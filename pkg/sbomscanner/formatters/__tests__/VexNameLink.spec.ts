import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import VexNameLink from '../VexNameLink.vue';

describe('VexNameLink.vue', () => {
  it('should render a link with the correct text and "to" prop', () => {
    const mockValue = 'My VEX Document';
    const mockRow = { id: 'vex-doc-id-456' };
    const mockClusterId = 'c-m-xyz123';

    const wrapper = shallowMount(VexNameLink, {
      props: {
        value: mockValue,
        row:   mockRow,
      },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub },
      },
    });

    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);

    expect(linkStub.text()).toBe(mockValue);

    const expectedUrl = `/c/${ mockClusterId }/imageScanner/vex_management/${ mockRow.id }`;

    expect(linkStub.props('to')).toBe(expectedUrl);
  });
});
