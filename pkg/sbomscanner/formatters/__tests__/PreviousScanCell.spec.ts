import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import PreviousScanCell from '../PreviousScanCell.vue';
import ProgressCell from '../ProgressCell.vue';
import TextWithPopedDetail from '../../components/common/TextWithPopedDetail.vue';

describe('PreviousScanCell.vue', () => {
  const mockT = jest.fn((key) => key);
  const mockRow = { metadata: { name: 'my-image-name' } };

  const mountComponent = (valueProp) => {
    return shallowMount(PreviousScanCell, {
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

  it('should render "Complete" status correctly', () => {
    const wrapper = mountComponent({ prevScanStatus: 'Complete' });

    const dot = wrapper.find('.dot');

    expect(dot.classes()).toContain('complete');

    const status = wrapper.find('.status');

    expect(status.classes()).toContain('complete');
    expect(status.text()).toBe('imageScanner.enum.status.complete');
    expect(mockT).toHaveBeenCalledWith('imageScanner.enum.status.complete');

    expect(wrapper.findComponent(ProgressCell).exists()).toBe(false);
    expect(wrapper.findComponent(TextWithPopedDetail).exists()).toBe(false);
  });

  it('should render "InProgress" status and the ProgressCell', () => {
    const mockValue = {
      prevScanStatus:     'InProgress',
      prevProgress:       50,
      prevProgressDetail: 'Scanning...',
    };
    const wrapper = mountComponent(mockValue);

    expect(wrapper.find('.dot').classes()).toContain('inprogress');
    expect(wrapper.find('.status').text()).toBe('imageScanner.enum.status.inprogress');
    expect(wrapper.find('span').text()).toBe('imageScanner.general.at');

    const progressCell = wrapper.findComponent(ProgressCell);

    expect(progressCell.exists()).toBe(true);

    const expectedProps = {
      metadata:       { name: mockRow.metadata.name },
      progress:       50,
      progressDetail: 'Scanning...',
      error:          null,
    };

    expect(progressCell.props('value')).toEqual(expectedProps);
    expect(wrapper.findComponent(TextWithPopedDetail).exists()).toBe(false);
  });

  it('should render "Failed" status and the TextWithPopedDetail', () => {
    const mockValue = {
      prevScanStatus: 'Failed',
      prevError:      'Scan timed out',
    };
    const wrapper = mountComponent(mockValue);

    expect(wrapper.find('.dot').classes()).toContain('failed');
    expect(wrapper.find('.status').text()).toBe('imageScanner.enum.status.failed');

    const errorDetail = wrapper.findComponent(TextWithPopedDetail);

    expect(errorDetail.exists()).toBe(true);

    expect(errorDetail.props('value')).toBe('imageScanner.general.error');
    const expectedDetail = {
      title:   `${ mockRow.metadata.name } - imageScanner.registries.configuration.scanTable.header.error`,
      message: 'Scan timed out',
      type:    'error',
    };

    expect(errorDetail.props('detail')).toEqual(expectedDetail);
    expect(wrapper.findComponent(ProgressCell).exists()).toBe(false);
  });

  it('should handle case-insensitivity for "failed" status', () => {
    const mockValue = {
      prevScanStatus: 'failed',
      prevError:      'Error',
    };
    const wrapper = mountComponent(mockValue);

    expect(wrapper.find('.dot').classes()).toContain('failed');
    expect(wrapper.find('.status').classes()).toContain('failed');
    expect(wrapper.find('.status').text()).toBe('imageScanner.enum.status.failed');
    expect(wrapper.findComponent(TextWithPopedDetail).exists()).toBe(true);
  });

  it('should render both progress and error if "failed" and progress exists', () => {
    const mockValue = {
      prevScanStatus: 'Failed',
      prevProgress:   99,
      prevError:      'Failed at 99%',
    };
    const wrapper = mountComponent(mockValue);

    expect(wrapper.findComponent(ProgressCell).exists()).toBe(true);
    expect(wrapper.findComponent(TextWithPopedDetail).exists()).toBe(true);
  });

  it('should render an empty state if no status is provided', () => {
    const wrapper = mountComponent({ prevScanStatus: null });

    expect(wrapper.find('.dot').exists()).toBe(false);

    const statusDiv = wrapper.find('.status');

    expect(statusDiv.exists()).toBe(true);
    expect(statusDiv.classes()).toEqual(['status']);
    expect(statusDiv.text()).toBe('');

    expect(wrapper.findComponent(ProgressCell).exists()).toBe(false);
    expect(wrapper.findComponent(TextWithPopedDetail).exists()).toBe(false);
  });
});
