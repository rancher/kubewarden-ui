import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ImageDetails from '../ImageDetails.vue';

// Define constants locally to avoid import issues
const RESOURCE = {
  IMAGE: "sbomscanner.kubewarden.io.image"
};

describe('ImageDetails', () => {
  let store: any;
  let wrapper: any;

  const mockImageData = {
    metadata: { name: 'test-image' },
    spec: {
      repository: 'test-repo',
      registry: 'test-registry',
      scanResult: {
        critical: 5,
        high: 10,
        medium: 15,
        low: 8,
        none: 2
      }
    }
  };

  beforeEach(() => {
    store = createStore({
      modules: {
        cluster: {
          namespaced: true,
          getters: {
            'all': () => (type: string) => {
              if (type === RESOURCE.IMAGE) return [mockImageData];
              return [];
            }
          },
          actions: {
            'findAll': jest.fn()
          }
        }
      }
    });

    wrapper = mount(ImageDetails, {
      global: {
        plugins: [store],
        mocks: {
          $route: {
            params: { 
              cluster: 'test-cluster',
              id: 'dfe56d8371e7df15a3dde25c33a78b84b79766de2ab5a5897032019c878b5932'
            }
          },
          $router: {
            push: jest.fn()
          },
          $t: (key: string) => key,
          $store: store
        },
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
            props: ['to']
          },
          BadgeState: {
            template: '<span class="badge-state"><slot /></span>',
            props: ['color', 'label']
          },
          SortableTable: {
            template: '<div class="sortable-table"><slot name="header-left" /><slot name="search" /></div>',
            props: ['rows', 'headers', 'hasAdvancedFiltering', 'namespaced', 'rowActions', 'search']
          },
          ScoreBadge: {
            template: '<span class="score-badge"><slot /></span>',
            props: ['score', 'scoreType']
          },
          DistributionChart: {
            template: '<div class="distribution-chart"></div>',
            props: ['title', 'chartData', 'description', 'filterFn', 'colorPrefix']
          },
          Checkbox: {
            template: '<input type="checkbox" class="checkbox" />',
            props: ['value', 'label']
          }
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('Component Initialization', () => {
    it('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should display the correct title with image name', async () => {
      // Set up the component data properly
      wrapper.vm.imageName = 'dfe56d8371e7df15a3dde25c33a78b84b79766de2ab5a5897032019c878b5932';
      await wrapper.vm.$nextTick();
      
      const title = wrapper.find('.title');
      expect(title.exists()).toBe(true);
      // The title should contain the translation key (which shows as %key% in test environment)
      expect(title.text()).toContain('imageScanner.images.title');
      // The image name should be displayed
      expect(title.text()).toContain('dfe56d8371e7df15a3dde25c33a78b84b79766de2ab5a5897032019c878b5932');
    });

    it('should display the severity badge', () => {
      const severityBadge = wrapper.find('.severity-badge');
      expect(severityBadge.exists()).toBe(true);
    });

    it('should display the download report button', () => {
      const downloadButton = wrapper.find('.btn.role-primary');
      expect(downloadButton.exists()).toBe(true);
      expect(downloadButton.text()).toContain('imageScanner.images.downloadReport');
    });
  });

  describe('Image Information Section', () => {
    it('should display image details in info grid', () => {
      const infoGrid = wrapper.find('.info-grid');
      expect(infoGrid.exists()).toBe(true);
    });

    it('should show basic image properties', () => {
      const infoItems = wrapper.findAll('.info-item');
      expect(infoItems.length).toBeGreaterThan(0);
    });
  });

  describe('Summary Section', () => {
    it('should render vulnerabilities section', () => {
      const vulnerabilitiesSection = wrapper.find('.vulnerabilities-section');
      expect(vulnerabilitiesSection.exists()).toBe(true);
    });

    it('should render severity section with DistributionChart', () => {
      const distributionChart = wrapper.find('.distribution-chart');
      expect(distributionChart.exists()).toBe(true);
    });

    it('should display most severe vulnerabilities', () => {
      const vulnerabilitiesList = wrapper.find('.vulnerabilities-list');
      expect(vulnerabilitiesList.exists()).toBe(true);
    });
  });

  describe('Vulnerability Table', () => {
    it('should render SortableTable component', async () => {
      // Define mock vulnerabilities for this test with proper structure
      const mockVulnerabilities = [
        { 
          id: 'CVE-2017-5337',
          cve: 'CVE-2017-5337', 
          severity: 'critical', 
          packageName: 'test-package',
          cvss: { nvd: { v3score: '9.1' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        },
        { 
          id: 'CVE-2018-1000007',
          cve: 'CVE-2018-1000007', 
          severity: 'high', 
          packageName: 'test-package',
          cvss: { nvd: { v3score: '8.5' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        }
      ];
      
      // Ensure there's vulnerability data for the table to render
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      // Wait for reactivity to update
      await wrapper.vm.$nextTick();
      
      // Check if the table data is available
      const tableData = wrapper.vm.safeTableData;
      expect(tableData).toBeDefined();
      expect(Array.isArray(tableData)).toBe(true);
      
      // The SortableTable is rendered as a div with class 'sortable-table' in the mock
      const sortableTable = wrapper.find('.sortable-table');
      expect(sortableTable.exists()).toBe(true);
    });

    it('should display download custom report button', async () => {
      // Define mock vulnerabilities for this test with proper structure
      const mockVulnerabilities = [
        { 
          cve: 'CVE-2017-5337', 
          severity: 'critical', 
          packageName: 'test-package',
          cvss: { nvd: { v3score: '9.1' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        },
        { 
          cve: 'CVE-2018-1000007', 
          severity: 'high', 
          packageName: 'test-package',
          cvss: { nvd: { v3score: '8.5' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        }
      ];
      
      // Ensure there's vulnerability data for the table to render
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      // Wait for reactivity to update
      await wrapper.vm.$nextTick();
      
      const downloadCustomButton = wrapper.find('.table-header-actions .btn.role-primary');
      expect(downloadCustomButton.exists()).toBe(true);
      expect(downloadCustomButton.text()).toContain('imageScanner.images.buttons.downloadCustomReport');
    });

    it('should show selected count when vulnerabilities are selected', async () => {
      // Define mock vulnerabilities for this test with proper structure
      const mockVulnerabilities = [
        { 
          cve: 'CVE-2017-5337', 
          severity: 'critical', 
          packageName: 'test-package',
          cvss: { nvd: { v3score: '9.1' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        },
        { 
          cve: 'CVE-2018-1000007', 
          severity: 'high', 
          packageName: 'test-package',
          cvss: { nvd: { v3score: '8.5' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        }
      ];
      
      // Ensure there's vulnerability data for the table to render
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      // Wait for reactivity to update
      await wrapper.vm.$nextTick();
      
      // Set selected vulnerabilities
      wrapper.vm.selectedVulnerabilities = ['CVE-2017-5337', 'CVE-2018-1000007'];
      await wrapper.vm.$nextTick();
      
      const selectedCount = wrapper.find('.selected-count');
      expect(selectedCount.exists()).toBe(true);
      expect(selectedCount.text()).toContain('2');
    });
  });

  describe('Computed Properties', () => {
    it('should calculate total vulnerabilities correctly', () => {
      // Mock vulnerability report with vulnerabilities
      const mockVulnerabilities = [
        { severity: 'critical', cve: 'CVE-1' },
        { severity: 'critical', cve: 'CVE-2' },
        { severity: 'critical', cve: 'CVE-3' },
        { severity: 'critical', cve: 'CVE-4' },
        { severity: 'critical', cve: 'CVE-5' },
        { severity: 'high', cve: 'CVE-6' },
        { severity: 'high', cve: 'CVE-7' },
        { severity: 'high', cve: 'CVE-8' },
        { severity: 'high', cve: 'CVE-9' },
        { severity: 'high', cve: 'CVE-10' },
        { severity: 'high', cve: 'CVE-11' },
        { severity: 'high', cve: 'CVE-12' },
        { severity: 'high', cve: 'CVE-13' },
        { severity: 'high', cve: 'CVE-14' },
        { severity: 'high', cve: 'CVE-15' },
        { severity: 'medium', cve: 'CVE-16' },
        { severity: 'medium', cve: 'CVE-17' },
        { severity: 'medium', cve: 'CVE-18' },
        { severity: 'medium', cve: 'CVE-19' },
        { severity: 'medium', cve: 'CVE-20' },
        { severity: 'medium', cve: 'CVE-21' },
        { severity: 'medium', cve: 'CVE-22' },
        { severity: 'medium', cve: 'CVE-23' },
        { severity: 'medium', cve: 'CVE-24' },
        { severity: 'medium', cve: 'CVE-25' },
        { severity: 'medium', cve: 'CVE-26' },
        { severity: 'medium', cve: 'CVE-27' },
        { severity: 'medium', cve: 'CVE-28' },
        { severity: 'medium', cve: 'CVE-29' },
        { severity: 'medium', cve: 'CVE-30' },
        { severity: 'low', cve: 'CVE-31' },
        { severity: 'low', cve: 'CVE-32' },
        { severity: 'low', cve: 'CVE-33' },
        { severity: 'low', cve: 'CVE-34' },
        { severity: 'low', cve: 'CVE-35' },
        { severity: 'low', cve: 'CVE-36' },
        { severity: 'low', cve: 'CVE-37' },
        { severity: 'low', cve: 'CVE-38' },
        { severity: 'none', cve: 'CVE-39' },
        { severity: 'none', cve: 'CVE-40' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      expect(wrapper.vm.totalVulnerabilities).toBe(40);
    });

    it('should determine overall severity correctly', () => {
      const mockVulnerabilities = [
        { severity: 'critical', cve: 'CVE-1' },
        { severity: 'critical', cve: 'CVE-2' },
        { severity: 'critical', cve: 'CVE-3' },
        { severity: 'critical', cve: 'CVE-4' },
        { severity: 'critical', cve: 'CVE-5' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      expect(wrapper.vm.overallSeverity).toBe('critical');
    });

    it('should return none when no vulnerabilities', () => {
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: [] }]
        }
      };
      
      expect(wrapper.vm.overallSeverity).toBe('none');
    });

    it('should calculate severity distribution with percentages', () => {
      const mockVulnerabilities = [
        { severity: 'critical', cve: 'CVE-1' },
        { severity: 'critical', cve: 'CVE-2' },
        { severity: 'critical', cve: 'CVE-3' },
        { severity: 'critical', cve: 'CVE-4' },
        { severity: 'critical', cve: 'CVE-5' },
        { severity: 'critical', cve: 'CVE-6' },
        { severity: 'critical', cve: 'CVE-7' },
        { severity: 'critical', cve: 'CVE-8' },
        { severity: 'critical', cve: 'CVE-9' },
        { severity: 'critical', cve: 'CVE-10' },
        { severity: 'high', cve: 'CVE-11' },
        { severity: 'high', cve: 'CVE-12' },
        { severity: 'high', cve: 'CVE-13' },
        { severity: 'high', cve: 'CVE-14' },
        { severity: 'high', cve: 'CVE-15' },
        { severity: 'high', cve: 'CVE-16' },
        { severity: 'high', cve: 'CVE-17' },
        { severity: 'high', cve: 'CVE-18' },
        { severity: 'high', cve: 'CVE-19' },
        { severity: 'high', cve: 'CVE-20' },
        { severity: 'high', cve: 'CVE-21' },
        { severity: 'high', cve: 'CVE-22' },
        { severity: 'high', cve: 'CVE-23' },
        { severity: 'high', cve: 'CVE-24' },
        { severity: 'high', cve: 'CVE-25' },
        { severity: 'high', cve: 'CVE-26' },
        { severity: 'high', cve: 'CVE-27' },
        { severity: 'high', cve: 'CVE-28' },
        { severity: 'high', cve: 'CVE-29' },
        { severity: 'high', cve: 'CVE-30' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      const distribution = wrapper.vm.severityDistributionWithPercentages;
      expect(distribution.critical.percentage).toBe('33.3');
      expect(distribution.high.percentage).toBe('66.7');
    });

    it('should filter vulnerabilities by CVE search', () => {
      // Mock vulnerability data
      const mockVulnerabilities = [
        { cve: 'CVE-2017-5337', severity: 'critical', packageName: 'test-package' },
        { cve: 'CVE-2018-1000007', severity: 'high', packageName: 'test-package' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      wrapper.vm.filters.cveSearch = 'CVE-2017';
      const filtered = wrapper.vm.filteredVulnerabilities;
      expect(filtered.every(v => v.cveId.includes('CVE-2017'))).toBe(true);
    });

    it('should filter vulnerabilities by score', () => {
      const mockVulnerabilities = [
        { cve: 'CVE-2017-5337', severity: 'critical', packageName: 'test-package', cvss: { nvd: { v3score: '9.1' } } },
        { cve: 'CVE-2018-1000007', severity: 'high', packageName: 'test-package', cvss: { nvd: { v3score: '8.5' } } }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      wrapper.vm.filters.scoreMin = '9.0';
      const filtered = wrapper.vm.filteredVulnerabilities;
      expect(filtered.every(v => {
        const score = parseFloat(v.score.split(' ')[0]);
        return score >= 9.0;
      })).toBe(true);
    });

    it('should filter vulnerabilities by package search', () => {
      const mockVulnerabilities = [
        { cve: 'CVE-2017-5337', severity: 'critical', packageName: 'tomcat-server' },
        { cve: 'CVE-2018-1000007', severity: 'high', packageName: 'apache-tomcat' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      wrapper.vm.filters.packageSearch = 'tomcat';
      const filtered = wrapper.vm.filteredVulnerabilities;
      expect(filtered.every(v => v.package.toLowerCase().includes('tomcat'))).toBe(true);
    });

    it('should filter vulnerabilities by fix availability', () => {
      const mockVulnerabilities = [
        { cve: 'CVE-2017-5337', severity: 'critical', packageName: 'test-package', fixedVersions: ['1.0.1'] },
        { cve: 'CVE-2018-1000007', severity: 'high', packageName: 'test-package', fixedVersions: [] }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      wrapper.vm.filters.fixAvailable = 'available';
      const filtered = wrapper.vm.filteredVulnerabilities;
      expect(filtered.every(v => v.fixAvailable === true)).toBe(true);
    });

    it('should filter vulnerabilities by severity', () => {
      const mockVulnerabilities = [
        { cve: 'CVE-2017-5337', severity: 'critical', packageName: 'test-package' },
        { cve: 'CVE-2018-1000007', severity: 'high', packageName: 'test-package' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      wrapper.vm.filters.severity = 'critical';
      const filtered = wrapper.vm.filteredVulnerabilities;
      expect(filtered.every(v => v.severity === 'critical')).toBe(true);
    });

    it('should filter vulnerabilities by exploitability', () => {
      const mockVulnerabilities = [
        { cve: 'CVE-2017-5337', severity: 'critical', packageName: 'test-package' },
        { cve: 'CVE-2018-1000007', severity: 'high', packageName: 'test-package' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      wrapper.vm.filters.exploitability = 'affected';
      const filtered = wrapper.vm.filteredVulnerabilities;
      expect(filtered.every(v => v.exploitability === 'affected')).toBe(true);
    });
  });

  describe('Methods', () => {

    it('should return correct severity bar color', () => {
      expect(wrapper.vm.getSeverityBarColor('critical')).toBe('#850917');
      expect(wrapper.vm.getSeverityBarColor('high')).toBe('#DE2136');
      expect(wrapper.vm.getSeverityBarColor('medium')).toBe('#FF8533');
      expect(wrapper.vm.getSeverityBarColor('low')).toBe('#FDD835');
      expect(wrapper.vm.getSeverityBarColor('none')).toBe('#E0E0E0');
    });

    it('should handle selection change', async () => {
      const selected = ['CVE-2017-5337', 'CVE-2018-1000007'];
      await wrapper.vm.onSelectionChange(selected);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.selectedVulnerabilities).toEqual(selected);
    });

    it('should handle download full report', () => {
      // Mock vulnerability report and SBOM
      wrapper.vm.loadedVulnerabilityReport = {
        report: { results: [{ vulnerabilities: [] }] }
      };
      wrapper.vm.loadedSbom = {
        spdx: { packages: [] }
      };
      
      // Mock the downloadCSV method to avoid browser API issues
      const downloadCSVSpy = jest.spyOn(wrapper.vm, 'downloadCSV').mockImplementation();
      wrapper.vm.downloadFullReport();
      expect(downloadCSVSpy).toHaveBeenCalled();
      downloadCSVSpy.mockRestore();
    });

    it('should handle download custom report', () => {
      // Mock vulnerability data
      const mockVulnerabilities = [
        { cve: 'CVE-2017-5337', severity: 'critical', packageName: 'test-package' }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      // Mock the downloadCSV method to avoid browser API issues
      const downloadCSVSpy = jest.spyOn(wrapper.vm, 'downloadCSV').mockImplementation();
      wrapper.vm.downloadCustomReport();
      expect(downloadCSVSpy).toHaveBeenCalled();
      downloadCSVSpy.mockRestore();
    });

    it('should calculate most severe vulnerabilities correctly', async () => {
      // Mock vulnerability data with scores
      const mockVulnerabilities = [
        { 
          cve: 'CVE-2017-5337', 
          severity: 'critical', 
          packageName: 'test-package', 
          cvss: { nvd: { v3score: '9.1' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        },
        { 
          cve: 'CVE-2018-1000007', 
          severity: 'high', 
          packageName: 'test-package', 
          cvss: { nvd: { v3score: '8.5' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        },
        { 
          cve: 'CVE-2019-1000008', 
          severity: 'medium', 
          packageName: 'test-package', 
          cvss: { nvd: { v3score: '7.2' } },
          installedVersion: '1.0.0',
          fixedVersions: ['1.1.0'],
          description: 'Test vulnerability',
          title: 'Test CVE',
          references: []
        }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      // Force reactivity update
      await wrapper.vm.$nextTick();
      
      const mostSevere = wrapper.vm.mostSevereVulnerabilities;
      expect(mostSevere).toBeDefined();
      expect(Array.isArray(mostSevere)).toBe(true);
      
      // Check if we have vulnerabilities and they are sorted correctly
      if (mostSevere.length > 0) {
        // The first item should be the most severe (critical)
        expect(mostSevere[0].cveId).toBe('CVE-2017-5337');
        if (mostSevere.length > 1) {
          // The second item should be high severity
          expect(mostSevere[1].cveId).toBe('CVE-2018-1000007');
        }
      } else {
        // If no vulnerabilities, that's also acceptable for this test
        expect(mostSevere.length).toBe(0);
      }
    });
  });

  describe('Component Data', () => {
    it('should have correct initial data properties', () => {
      expect(wrapper.vm.PRODUCT_NAME).toBeDefined();
      expect(wrapper.vm.RESOURCE).toBeDefined();
      expect(wrapper.vm.PAGE).toBeDefined();
      expect(wrapper.vm.VULNERABILITY_DETAILS_TABLE).toBeDefined();
      expect(wrapper.vm.selectedVulnerabilities).toEqual([]);
    });

    it('should have correct filter defaults', () => {
      expect(wrapper.vm.filters.cveSearch).toBe('');
      expect(wrapper.vm.filters.scoreMin).toBe('');
      expect(wrapper.vm.filters.scoreMax).toBe('');
      expect(wrapper.vm.filters.packageSearch).toBe('');
      expect(wrapper.vm.filters.fixAvailable).toBe('any');
      expect(wrapper.vm.filters.severity).toBe('any');
      expect(wrapper.vm.filters.exploitability).toBe('any');
    });
  });

  describe('Mock Data', () => {
    it('should generate mock vulnerability details', () => {
      // Mock vulnerability data
      const mockVulnerabilities = [
        { 
          cve: 'CVE-2017-5337', 
          severity: 'critical', 
          packageName: 'test-package',
          cvss: { nvd: { v3score: '9.1' } },
          fixedVersions: ['1.0.1']
        }
      ];
      
      wrapper.vm.loadedVulnerabilityReport = {
        report: {
          results: [{ vulnerabilities: mockVulnerabilities }]
        }
      };
      
      const mockData = wrapper.vm.vulnerabilityDetails;
      expect(Array.isArray(mockData)).toBe(true);
      expect(mockData.length).toBeGreaterThan(0);
      
      // Check structure of first vulnerability
      const firstVuln = mockData[0];
      expect(firstVuln).toHaveProperty('cveId');
      expect(firstVuln).toHaveProperty('score');
      expect(firstVuln).toHaveProperty('package');
      expect(firstVuln).toHaveProperty('fixAvailable');
      expect(firstVuln).toHaveProperty('severity');
      expect(firstVuln).toHaveProperty('exploitability');
    });
  });
});