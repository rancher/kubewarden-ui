import { shallowMount } from '@vue/test-utils';
import UriExternalLink from '../UriExternalLink.vue';

describe('UriExternalLink.vue', () => {
  it('should render an external link when row is provided', () => {
    const mockUrl = 'https://example.com/test-path';
    const mockRow = { id: 'r-123' };

    const wrapper = shallowMount(UriExternalLink, {
      props: {
        value: mockUrl,
        row:   mockRow,
      },
    });

    const link = wrapper.find('a.uri-link');

    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe(mockUrl);
    expect(link.text()).toBe(mockUrl);
    expect(link.find('i.icon-external-link').exists()).toBe(true);
  });

  it('should render correctly and use default prop when row is not provided', () => {
    const mockUrl = 'https://example.com/another-path';

    const wrapper = shallowMount(UriExternalLink, { props: { value: mockUrl } });

    const link = wrapper.find('a.uri-link');

    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe(mockUrl);
    expect(link.text()).toBe(mockUrl);
  });
});
