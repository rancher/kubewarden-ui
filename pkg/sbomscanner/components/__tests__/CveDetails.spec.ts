import { jest } from '@jest/globals';
import { shallowMount, flushPromises } from '@vue/test-utils';
import CveDetails from '../CveDetails.vue';
import { BadgeState } from '@components/BadgeState';
import { RESOURCE } from '@sbomscanner/types';
import { NVD_BASE_URL, CVSS_VECTOR_BASE_URL } from '@sbomscanner/constants';

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'test-product',
  RESOURCE:     { VULNERABILITY_REPORT: 'storage.sbomscanner.kubewarden.io.vulnerabilityreport' },
  PAGE:         { VULNERABILITIES: 'test-page-vulns' }
}));

jest.mock('@sbomscanner/constants', () => ({
  NVD_BASE_URL:         'https://nvd.nist.gov/vuln/detail/',
  CVSS_VECTOR_BASE_URL: 'https://www.first.org/cvss/calculator/'
}));

const mockCveId = 'CVE-2023-1234';
const mockVulReports = [
  {
    report: {
      results: [
        {
          vulnerabilities: [
            {
              cve:        'CVE-2023-9999',
              severity:   'Low',
              title:      'Another vulnerability',
              references: [],
              cvss:       {}
            },
            {
              cve:        mockCveId,
              severity:   'Critical',
              title:      'A very bad vulnerability',
              references: [
                'https://suse.com/security/cve/CVE-2023-1234',
                'https://www.redhat.com/en/blog/press-release',
                'https://nvd.nist.gov/vuln/detail/CVE-2023-1234'
              ],
              cvss: {
                nvd: {
                  v3score:  9.8,
                  v3vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'
                },
                redhat: {
                  v3score:  8.1,
                  v3vector: 'CVSS:3.0/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H'
                },
                ghsa: { v3score: 5.0 }
              }
            }
          ]
        }
      ]
    }
  },
  {
    report: {
      results: [
        {
          vulnerabilities: [
            {
              cve:      mockCveId,
              severity: 'Critical',
              title:    'A very bad vulnerability',
            }
          ]
        }
      ]
    }
  }
];

const mockStore = { dispatch: jest.fn(() => Promise.resolve(mockVulReports)) };

const mockRoute = { params: { id: mockCveId } };

const mockT = (key) => key;

describe('CveDetails.vue', () => {
  let wrapper: any;

  const createWrapper = (store = mockStore, route = mockRoute) => {
    return shallowMount(CveDetails, {
      global: {
        components: { BadgeState },
        mocks:      {
          $store: store,
          $route: route,
          t:      mockT,
        }
      },
      stubs: { BadgeState: true }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = createWrapper();
  });

  describe('Unit Methods', () => {
    it('groupReferencesByDomain should group URLs correctly', () => {
      const urls = [
        'https://google.com/foo',
        'https://www.suse.com/bar',
        'https://security.redhat.com/baz',
        'https://google.com/another',
      ];
      const expected = [
        { name: 'Google', references: ['https://google.com/foo', 'https://google.com/another'] },
        { name: 'Suse', references: ['https://www.suse.com/bar'] },
        { name: 'Redhat', references: ['https://security.redhat.com/baz'] },
      ];

      expect(wrapper.vm.groupReferencesByDomain(urls)).toEqual(expected);
    });

    it('convertCvssToSources should create correct source links', () => {
      const cvss = {
        nvd: {}, redhat: {}, ghsa: {}
      };
      const cveId = 'CVE-TEST';
      const expected = [
        { name: 'NVD', link: `${ NVD_BASE_URL }${ cveId }` },
        { name: 'REDHAT', link: '' },
        { name: 'GHSA', link: '' },
      ];

      expect(wrapper.vm.convertCvssToSources(cvss, cveId)).toEqual(expected);
    });

    it('convertCvss should format scores correctly', () => {
      const cvssObj = {
        nvd: {
          v3score:  9.8,
          v3vector: 'CVSS:3.1/AV:N'
        },
        redhat: {
          v2score:  7.5,
          v3vector: 'CVSS:3.0/AV:L'
        }
      };
      const expected = [
        {
          source: 'Nvd v3score',
          score:  9.8,
          link:   `${ CVSS_VECTOR_BASE_URL }3-1#CVSS:3.1/AV:N`
        },
        {
          source: 'Redhat v2score',
          score:  7.5,
          link:   `${ CVSS_VECTOR_BASE_URL }3-0#CVSS:3.0/AV:L`
        },
      ];

      expect(wrapper.vm.convertCvss(cvssObj)).toEqual(expected);
    });

    it('getCveMetaData should extract and process data correctly', () => {
      const { cveMetaData, totalScanned } = wrapper.vm.getCveMetaData(mockVulReports, mockCveId);

      expect(totalScanned).toBe(2);
      expect(cveMetaData.score).toBe('9.8 (v3)');
      expect(cveMetaData.severity).toBe('Critical');
      expect(cveMetaData.title).toBe('A very bad vulnerability');
      expect(cveMetaData.sources).toEqual([
        { name: 'NVD', link: `${ NVD_BASE_URL }${ mockCveId }` },
        { name: 'REDHAT', link: '' },
        { name: 'GHSA', link: '' },
      ]);
      expect(cveMetaData.advisoryVendors).toEqual([
        { name: 'Suse', references: ['https://suse.com/security/cve/CVE-2023-1234'] },
        { name: 'Redhat', references: ['https://www.redhat.com/en/blog/press-release'] },
        { name: 'Nist', references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-1234'] },
      ]);
      expect(cveMetaData.cvssScores).toContainEqual({
        source: 'Nvd v3score',
        score:  9.8,
        link:   `${ CVSS_VECTOR_BASE_URL }3-1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
      });
      expect(cveMetaData.cvssScores).toContainEqual({
        source: 'Redhat v3score',
        score:  8.1,
        link:   `${ CVSS_VECTOR_BASE_URL }3-0#CVSS:3.0/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H`
      });
      expect(cveMetaData.cvssScores).toContainEqual({
        source: 'Ghsa v3score',
        score:  5.0,
        link:   ''
      });
    });
  });

  describe('Component Lifecycle and Rendering', () => {
    it('should load data on mount due to immediate watch', async() => {
      expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.VULNERABILITY_REPORT });
      await flushPromises();

      expect(wrapper.vm.cveDetail).not.toBeNull();
      expect(wrapper.vm.cveDetail.id).toBe(mockCveId);
      expect(wrapper.vm.cveDetail.totalImages).toBe(2);
      expect(wrapper.vm.cveDetail.score).toBe('9.8 (v3)');
    });

    it('should render CVE details correctly after data load', async() => {
      await flushPromises();

      const title = wrapper.find('.resource-header-name');

      expect(title.text()).toContain(`imageScanner.vulnerabilities.title: ${ mockCveId }`);

      const description = wrapper.find('.description');

      expect(description.text()).toBe('A very bad vulnerability');

      const statItems = wrapper.findAll('.stat-item');

      expect(statItems[0].text()).toContain('imageScanner.vulnerabilities.details.score:9.8 (v3)');
      expect(statItems[1].text()).toContain('imageScanner.vulnerabilities.details.imageIdentifiedIn:2');

      const sourceLinks = wrapper.findAll('.source-link');

      expect(sourceLinks.length).toBe(1);
      expect(sourceLinks[0].attributes('href')).toBe(`${ NVD_BASE_URL }${ mockCveId }`);
      expect(sourceLinks[0].text()).toContain('NVD');

      const cvssLinks = wrapper.findAll('.cvss-link');

      expect(cvssLinks.length).toBe(3);
      expect(cvssLinks[0].text()).toContain('Nvd v3score 9.8');
      expect(cvssLinks[0].attributes('href')).toContain('CVSS:3.1');
    });

    it('should render "unknown" for missing CVE data', async() => {
      const route = { params: { id: 'CVE-NOT-FOUND' } };

      wrapper = createWrapper(mockStore, route);
      await flushPromises();

      expect(wrapper.vm.cveDetail.title).toBeUndefined();
      expect(wrapper.vm.cveDetail.score).toBeUndefined();
      expect(wrapper.vm.cveDetail.totalImages).toBe(2);

      const description = wrapper.find('.description');

      expect(description.text()).toBe('imageScanner.general.unknown');

      const statItems = wrapper.findAll('.stat-item');

      expect(statItems[0].text()).toContain('imageScanner.vulnerabilities.details.score:imageScanner.general.unknown');
    });
  });

  describe('User Interaction (Advisory Links)', () => {
    it('should show references on vendor tag click and hide on subsequent click or close icon click', async() => {
      await flushPromises();

      expect(wrapper.find('.hover-panel').exists()).toBe(false);

      const vendorTags = wrapper.findAll('.vendor-tag');
      const firstVendorTag = vendorTags[0];
      const secondVendorTag = vendorTags[1];
      const firstVendorData = { name: 'Suse', references: ['https://suse.com/security/cve/CVE-2023-1234'] };

      await firstVendorTag.trigger('click');
      expect(wrapper.vm.selectedVendor).toEqual(firstVendorData);

      await wrapper.vm.$nextTick();

      let hoverPanel = wrapper.find('.hover-panel');

      expect(hoverPanel.exists()).toBe(true);
      expect(hoverPanel.find('h4').text()).toBe(`References for ${ mockCveId }`);
      expect(hoverPanel.find('.ref-url').attributes('href')).toBe('https://suse.com/security/cve/CVE-2023-1234');

      const secondVendorData = { name: 'Redhat', references: ['https://www.redhat.com/en/blog/press-release'] };

      await secondVendorTag.trigger('click');
      expect(wrapper.vm.selectedVendor).toEqual(secondVendorData);

      await wrapper.vm.$nextTick();
      hoverPanel = wrapper.find('.hover-panel');
      expect(hoverPanel.exists()).toBe(true);
      expect(hoverPanel.find('.ref-url').attributes('href')).toBe('https://www.redhat.com/en/blog/press-release');

      const closeIcon = wrapper.find('.icon-close');

      await closeIcon.trigger('click');
      expect(wrapper.vm.selectedVendor).toBeNull();

      await wrapper.vm.$nextTick();
      expect(wrapper.find('.hover-panel').exists()).toBe(false);

      await firstVendorTag.trigger('click');
      expect(wrapper.vm.selectedVendor).toEqual(firstVendorData);

      await firstVendorTag.trigger('click');
      expect(wrapper.vm.selectedVendor).toBeNull();

      await wrapper.vm.$nextTick();
      expect(wrapper.find('.hover-panel').exists()).toBe(false);
    });
  });
});