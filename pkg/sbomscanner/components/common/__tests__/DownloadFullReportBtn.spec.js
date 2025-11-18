/* eslint-env jest */

import { shallowMount } from '@vue/test-utils';
import DownloadFullReportBtn from '../DownloadFullReportBtn.vue';
import { downloadCSV, downloadJSON } from '@sbomscanner/utils/report';

// Mock dependencies
jest.mock('@sbomscanner/utils/report', () => ({
  downloadCSV:  jest.fn(),
  downloadJSON: jest.fn(),
}));

jest.mock('dayjs', () => {
  const mockDay = jest.fn(() => ({ format: jest.fn().mockReturnValue('MMDDYYYY_HHmmss') }));

  return mockDay;
});

describe('DownloadFullReportBtn.vue', () => {
  let wrapper;
  let mockStore;

  const mockVulnerabilityDetails = [
    {
      cveId:            'CVE-2023-1234',
      score:            '9.8',
      package:          'test-package',
      fixVersion:       '1.2.4',
      severity:         'CRITICAL',
      exploitability:   'High',
      installedVersion: '1.2.3',
      packagePath:      '/usr/lib/test-package',
      description:      'A "critical" vulnerability with quotes and\n newlines.',
    },
  ];

  const mockVulnerabilityReport = {
    report: {
      schema_version:  1,
      vulnerabilities: mockVulnerabilityDetails,
    },
  };

  const imageName = 'my-test-image';

  const createWrapper = (props = {}) => {
    mockStore = { dispatch: jest.fn() };

    wrapper = shallowMount(DownloadFullReportBtn, {
      propsData: {
        vulnerabilityDetails: mockVulnerabilityDetails,
        vulnerabilityReport:  mockVulnerabilityReport,
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
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    document.body.innerHTML = '';
  });

  describe('UI and Dropdown Interaction', () => {
    it('should render the main download button', () => {
      createWrapper();
      expect(wrapper.find('.dropdown-main').exists()).toBe(true);
      expect(wrapper.find('.dropdown-main').text()).toContain('imageScanner.images.downloadReport');
    });

    it('should not show the dropdown menu by default', () => {
      createWrapper();
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false);
    });

    it('should toggle the dropdown menu when the toggle button is clicked', async() => {
      createWrapper();
      const toggleButton = wrapper.find('.dropdown-toggle');

      await toggleButton.trigger('click');
      expect(wrapper.vm.showDownloadDropdown).toBe(true);
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true);

      await toggleButton.trigger('click');
      expect(wrapper.vm.showDownloadDropdown).toBe(false);
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false);
    });

    it('should close the dropdown when clicking outside', async() => {
      createWrapper();
      // Manually open dropdown
      await wrapper.setData({ showDownloadDropdown: true });
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true);

      // Simulate click outside
      const outsideElement = document.createElement('div');

      document.body.appendChild(outsideElement);
      const event = new MouseEvent('mousedown', { bubbles: true });

      outsideElement.dispatchEvent(event);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDownloadDropdown).toBe(false);
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false);
    });

    it('should not close the dropdown if it is not open when clicking outside', async() => {
      createWrapper();
      const closeSpy = jest.spyOn(wrapper.vm, 'closeDownloadDropdown');

      // Dropdown is closed by default
      const event = new MouseEvent('mousedown', { bubbles: true });

      document.body.dispatchEvent(event);
      await wrapper.vm.$nextTick();

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should add and remove event listener for outside click', () => {
      const addSpy = jest.spyOn(document, 'addEventListener');
      const removeSpy = jest.spyOn(document, 'removeEventListener');

      createWrapper();
      expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      wrapper.unmount();
      expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });
  });

  describe('Full Report (CSV) Download', () => {
    it('should generate and download a CSV report on button click', async() => {
      createWrapper();
      const mainButton = wrapper.find('.dropdown-main');

      await mainButton.trigger('click');

      const expectedCsv = [
        'CVE_ID,SCORE,PACKAGE,FIX AVAILABLE,SEVERITY,EXPLOITABILITY,PACKAGE VERSION,PACKAGE PATH,DESCRIPTION',
        '"CVE-2023-1234","9.8","test-package","1.2.4","CRITICAL","High","1.2.3","/usr/lib/test-package","A \'critical\' vulnerability with quotes and  newlines."',
      ].join('\n');

      expect(downloadCSV).toHaveBeenCalledWith(
        expectedCsv,
        'my-test-image-image-detail-report_MMDDYYYY_HHmmss.csv'
      );

      expect(mockStore.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });
      expect(wrapper.vm.showDownloadDropdown).toBe(false);
    });

    it('should show an error if vulnerabilityDetails is missing', async() => {
      createWrapper({ vulnerabilityDetails: null });
      const mainButton = wrapper.find('.dropdown-main');

      await mainButton.trigger('click');

      expect(downloadCSV).not.toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'Error',
        message: 'No vulnerability report available for download'
      }, { root: true });
    });

    it('should use default empty array for vulnerabilityDetails if prop is not provided', async() => {
      // Mount without the vulnerabilityDetails prop
      const { vulnerabilityDetails, ...props } = wrapper.props();

      wrapper.unmount(); // Unmount the one from createWrapper

      wrapper = shallowMount(DownloadFullReportBtn, {
        propsData: { ...props },
        global:    { mocks: { $store: mockStore, t: (key) => key } },
      });

      const mainButton = wrapper.find('.dropdown-main');

      await mainButton.trigger('click');

      const expectedCsvHeaders = 'CVE_ID,SCORE,PACKAGE,FIX AVAILABLE,SEVERITY,EXPLOITABILITY,PACKAGE VERSION,PACKAGE PATH,DESCRIPTION';

      expect(vulnerabilityDetails).toBeNull();
      expect(downloadCSV).toHaveBeenCalledWith(
        expectedCsvHeaders,
        'my-test-image-image-detail-report_MMDDYYYY_HHmmss.csv'
      );
    });

    it('should handle errors during CSV generation', async() => {
      createWrapper();
      const error = new Error('CSV Generation Failed');

      // Mock the internal method to throw an error
      jest.spyOn(wrapper.vm, 'generateCSVFromVulnerabilityReport').mockImplementation(() => {
        throw error;
      });

      const mainButton = wrapper.find('.dropdown-main');

      await mainButton.trigger('click');

      expect(downloadCSV).not.toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'Error',
        message: `Failed to download full report: ${ error.message }`
      }, { root: true });
    });

    it('should handle missing description property gracefully during CSV generation', async() => {
      createWrapper();
      // Use data with a missing description to ensure it doesn't crash
      const detailsWithMissingDesc = [{
        ...mockVulnerabilityDetails[0],
        description: undefined,
      }];

      await wrapper.setProps({ vulnerabilityDetails: detailsWithMissingDesc });

      const mainButton = wrapper.find('.dropdown-main');

      await mainButton.trigger('click');

      // It should NOT throw an error and should generate a CSV with an empty description
      expect(mockStore.dispatch).not.toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
      expect(downloadCSV).toHaveBeenCalledTimes(1);

      const generatedCsv = downloadCSV.mock.calls[0][0];

      expect(generatedCsv).toContain('"CVE-2023-1234"');
      expect(generatedCsv.endsWith(',""')).toBe(true); // The empty description field at the end of the row
    });

    it('should handle missing properties in vulnerability details gracefully', async() => {
      createWrapper();
      // Provide an object with some missing properties to test the '||' fallbacks
      const incompleteDetails = [{
        cveId:   'CVE-2024-5555',
        package: 'incomplete-package',
        // score, fixVersion, severity, etc., are missing
      }];

      await wrapper.setProps({ vulnerabilityDetails: incompleteDetails });

      const mainButton = wrapper.find('.dropdown-main');

      await mainButton.trigger('click');

      const generatedCsv = downloadCSV.mock.calls[0][0];

      // Expect a row with many empty fields, but no 'undefined' strings
      expect(generatedCsv).toContain('"CVE-2024-5555","","incomplete-package","","","","","",""');
    });

    it('should download CSV from the dropdown item click', async() => {
      createWrapper();
      await wrapper.setData({ showDownloadDropdown: true });

      const dropdownItem = wrapper.findAll('.dropdown-item').at(0);

      await dropdownItem.trigger('click');

      expect(downloadCSV).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });
    });
  });

  describe('Vulnerability Report (JSON) Download', () => {
    beforeEach(async() => {
      createWrapper();
      await wrapper.setData({ showDownloadDropdown: true });
    });

    it('should generate and download a JSON report on dropdown item click', async() => {
      const jsonButton = wrapper.findAll('.dropdown-item').at(1);

      await jsonButton.trigger('click');

      const expectedJson = JSON.stringify(mockVulnerabilityReport.report, null, 2);

      expect(downloadJSON).toHaveBeenCalledWith(
        expectedJson,
        'my-test-image-vulnerability-report_MMDDYYYY_HHmmss.json'
      );

      expect(mockStore.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });
      expect(wrapper.vm.showDownloadDropdown).toBe(false);
    });

    it('should show an error if vulnerabilityReport is missing', async() => {
      createWrapper({ vulnerabilityReport: null });
      await wrapper.setData({ showDownloadDropdown: true });

      const jsonButton = wrapper.findAll('.dropdown-item').at(1);

      await jsonButton.trigger('click');

      expect(downloadJSON).not.toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'Error',
        message: 'No vulnerability report data available for download'
      }, { root: true });
    });

    it('should handle errors during JSON generation', async() => {
      createWrapper();
      await wrapper.setData({ showDownloadDropdown: true });

      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;

      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('JSON Error');
      });

      const jsonButton = wrapper.findAll('.dropdown-item').at(1);

      await jsonButton.trigger('click');

      expect(downloadJSON).not.toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledWith('growl/error', expect.objectContaining({
        title:   'Error',
        message: 'Failed to download vulnerability report',
      }), { root: true });

      // Restore original function
      JSON.stringify = originalStringify;
    });
  });
});
