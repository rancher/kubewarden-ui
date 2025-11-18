import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import DownloadCustomReport from '../DownloadCustomReport.vue';

describe('DownloadCustomReport.vue', () => {
  it('should render the buttonName prop', () => {
    const buttonName = 'Download PDF';
    const wrapper = shallowMount(DownloadCustomReport, { props: { buttonName } });

    expect(wrapper.find('button').text()).toContain(buttonName);
  });

  it('should be disabled by default when selectedRows is empty', () => {
    const wrapper = shallowMount(DownloadCustomReport);
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should be disabled when selectedRows is null', () => {
    const wrapper = shallowMount(DownloadCustomReport, { props: { selectedRows: null } });
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should be enabled when selectedRows has items', () => {
    const mockRows = [{ id: 1 }, { id: 2 }];
    const wrapper = shallowMount(DownloadCustomReport, { props: { selectedRows: mockRows } });
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('should call downloadFn when clicked and enabled', async() => {
    const mockFn = jest.fn();
    const mockRows = [{ id: 1 }];

    const wrapper = shallowMount(DownloadCustomReport, {
      props: {
        selectedRows: mockRows,
        downloadFn:   mockFn,
      },
    });

    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeUndefined();
    await button.trigger('click');

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not call downloadFn when clicked and disabled', async() => {
    const mockFn = jest.fn();

    const wrapper = shallowMount(DownloadCustomReport, {
      props: {
        selectedRows: [],
        downloadFn:   mockFn,
      },
    });

    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeDefined();

    await button.trigger('click');

    expect(mockFn).not.toHaveBeenCalled();
  });
});
