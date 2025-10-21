import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import ProgressCell from '../ProgressCell.vue';
import TextWithPopedDetail from '../../components/common/TextWithPopedDetail.vue';

describe('ProgressCell.vue', () => {
  const mockT = jest.fn((key) => key);
  const mockRow = { id: 'r-123' };

  const mountComponent = (valueProp) => {
    return shallowMount(ProgressCell, {
      props: {
        value: valueProp,
        row:   mockRow,
      },
      global: { mocks: { t: mockT } },
    });
  };

  beforeEach(() => {
    mockT.mockClear();
  });

  it.each([
    { progress: null },
    { progress: undefined },
    {}, // Test empty object
  ])('should render "n/a" when progress is not defined', (mockValue) => {
    const wrapper = mountComponent(mockValue);

    const span = wrapper.find('.progress-text.none');

    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('n/a');

    expect(wrapper.findComponent(TextWithPopedDetail).exists()).toBe(false);
  });

  it('should render progress and detail when progress is 0', () => {
    const mockValue = {
      progress:       0,
      progressDetail: 'Starting...',
      metadata:       { name: 'my-image' },
    };
    const wrapper = mountComponent(mockValue);

    expect(wrapper.find('.progress-text.none').exists()).toBe(false);

    const detail = wrapper.findComponent(TextWithPopedDetail);

    expect(detail.exists()).toBe(true);
    expect(detail.props('value')).toBe('0%');
    expect(detail.props('detail')).toEqual({
      title:   'my-image - 0%',
      message: 'Starting...',
      type:    'info',
    });
  });

  it('should render progress and detail using metadata.name', () => {
    const mockValue = {
      progress:       50,
      progressDetail: 'Scanning in progress...',
      error:          null,
      metadata:       { name: 'my-image' },
      registryName:   'my-registry',
    };
    const wrapper = mountComponent(mockValue);

    const details = wrapper.findAllComponents(TextWithPopedDetail);

    expect(details).toHaveLength(1);

    const progressDetail = details[0];

    expect(progressDetail.props('value')).toBe('50%');
    expect(progressDetail.props('detail')).toEqual({
      title:   'my-image - 50%',
      message: 'Scanning in progress...',
      type:    'info',
    });
  });

  it('should render progress and detail using registryName as fallback', () => {
    const mockValue = {
      progress:       50,
      progressDetail: 'Scanning in progress...',
      metadata:       {},
      registryName:   'my-registry',
    };
    const wrapper = mountComponent(mockValue);

    const detail = wrapper.findComponent(TextWithPopedDetail);

    expect(detail.exists()).toBe(true);
    expect(detail.props('detail').title).toBe('my-registry - 50%');
  });

  it('should render both progress and error details when an error is present', () => {
    const mockValue = {
      progress:       99,
      progressDetail: 'Almost done...',
      error:          'Scan failed',
      metadata:       { name: 'failed-image' },
    };
    const wrapper = mountComponent(mockValue);

    const details = wrapper.findAllComponents(TextWithPopedDetail);

    expect(details).toHaveLength(2);

    const progressDetail = details[0];

    expect(progressDetail.props('value')).toBe('99%');
    expect(progressDetail.props('detail')).toEqual({
      title:   'failed-image - 99%',
      message: 'Almost done...',
      type:    'info',
    });

    const errorDetail = details[1];

    expect(errorDetail.props('value')).toBe('imageScanner.general.error');
    expect(errorDetail.props('detail')).toEqual({
      title:   'failed-image - imageScanner.registries.configuration.scanTable.header.error',
      message: 'Scan failed',
      type:    'error',
    });

    expect(mockT).toHaveBeenCalledWith('imageScanner.general.error');
    expect(mockT).toHaveBeenCalledWith('imageScanner.registries.configuration.scanTable.header.error');
  });
});
