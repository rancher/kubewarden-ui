/* eslint-env jest */

import { shallowMount } from '@vue/test-utils';
import { downloadJSON } from '@sbomscanner/utils/report';
import dayjs from 'dayjs';
import DownloadSBOMBtn from '../DownloadSBOMBtn.vue';

jest.mock('@sbomscanner/utils/report');

jest.mock('dayjs', () => ({
  __esModule: true, // This is important for mocking ES6 modules with default exports
  default:    jest.fn(() => ({ format: jest.fn().mockReturnValue('MMDDYYYY_HHmmss') })),
}));

describe('DownloadSBOMBtn.vue', () => {
  let wrapper;
  let mockStore;

  const mockSbom = {
    spdx: {
      spdxVersion: 'SPDX-2.2',
      name:        'test-sbom',
    },
  };

  const imageName = 'my-test-image';

  // Helper function to create the wrapper
  const createWrapper = (props = {}) => {
    mockStore = { dispatch: jest.fn() };

    wrapper = shallowMount(DownloadSBOMBtn, {
      propsData: {
        sbom: mockSbom,
        imageName,
        ...props,
      },
      global: {
        mocks: {
          $store: mockStore,
          t:      (key) => key, // Mock the translation function
        },
      },
    });
  };

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    downloadJSON.mockClear();
    dayjs.mockClear();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render the button with correct text and icon', () => {
    createWrapper();
    const button = wrapper.find('button');

    expect(button.exists()).toBe(true);
    expect(button.find('i.icon-download').exists()).toBe(true);
    expect(button.text()).toContain('imageScanner.images.downloadSBOM');
  });

  it('should download SBOM as JSON when button is clicked', async() => {
    createWrapper();
    await wrapper.find('button').trigger('click');

    const expectedJson = JSON.stringify(mockSbom.spdx, null, 2);
    const expectedFilename = 'my-test-image-sbom_MMDDYYYY_HHmmss.spdx.json';

    expect(downloadJSON).toHaveBeenCalledWith(expectedJson, expectedFilename);
    expect(mockStore.dispatch).toHaveBeenCalledWith('growl/success', {
      title:   'Success',
      message: 'SBOM downloaded successfully'
    }, { root: true });
  });

  it('should show an error if sbom prop is not provided', async() => {
    createWrapper({ sbom: null });
    await wrapper.find('button').trigger('click');

    expect(downloadJSON).not.toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalledWith('growl/error', {
      title:   'Error',
      message: 'No SBOM data available for download'
    }, { root: true });
  });

  it('should handle errors during JSON generation', async() => {
    createWrapper();
    const error = new Error('JSON generation failed');

    // Mock JSON.stringify to throw an error for this test
    const originalStringify = JSON.stringify;

    JSON.stringify = jest.fn().mockImplementation(() => {
      throw error;
    });

    await wrapper.find('button').trigger('click');

    expect(downloadJSON).not.toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalledWith('growl/error', {
      title:   'Error',
      message: 'Failed to download SBOM'
    }, { root: true });

    // Restore original function
    JSON.stringify = originalStringify;
  });
});
