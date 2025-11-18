import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import MostSevereVulnerabilities from '../MostSevereVulnerabilities.vue';
import { PRODUCT_NAME, PAGE } from '@sbomscanner/types';

const mockReport = {
  report: {
    results: [
      {
        vulnerabilities: [
          {
            cve: 'CVE-LOW', packageName: 'pkg-low', severity: 'low', cvss: {}, fixedVersions: []
          },
          {
            cve: 'CVE-CRIT-1', packageName: 'pkg-crit-1', severity: 'critical', cvss: { nvd: { v3score: '9.8' } }, fixedVersions: ['1.1']
          },
          {
            cve: 'CVE-MED', packageName: 'pkg-med', severity: 'medium', cvss: { ghsa: { v3score: '5.0' } }, fixedVersions: null
          },
          {
            cve: 'CVE-CRIT-2', packageName: 'pkg-crit-2', severity: 'critical', cvss: { nvd: { v3score: '7.5' } }, fixedVersions: []
          },
          {
            cve: 'CVE-HIGH', packageName: 'pkg-high', severity: 'high', cvss: { redhat: { v3score: '8.0' } }, fixedVersions: ['2.0']
          },
          {
            cve: 'CVE-NONE', packageName: 'pkg-none', severity: 'none', cvss: {}, fixedVersions: []
          },
          {
            cve: 'CVE-CRIT-3', packageName: 'pkg-crit-3', severity: 'critical', cvss: { nvd: { v3score: '9.0' } }, fixedVersions: []
          },
          {
            cve: 'CVE-NULL-SEV', packageName: 'pkg-null-sev', severity: null, cvss: {}, fixedVersions: []
          },
        ]
      }
    ]
  }
};

const fallbackReport = {
  vulnerabilities: [
    {
      cve: 'CVE-FB-1', packageName: 'pkg-fb-1', severity: 'high', cvss: { nvd: { v3score: '8.8' } }, fixedVersions: ['1.0']
    },
  ]
};

const reportWithNoScore = {
  report: {
    results: [{
      vulnerabilities: [{
        cve: 'CVE-NO-SCORE', packageName: 'pkg-no-score', severity: 'low', cvss: {}, fixedVersions: []
      }]
    }]
  }
};

const createWrapper = (propsData) => {
  return shallowMount(MostSevereVulnerabilities, {
    propsData,
    global: {
      mocks: {
        t:      (key) => key,
        $route: { params: { cluster: 'c-12345' } },
      },
      stubs: {
        RouterLink:       RouterLinkStub,
        ScoreBadge:       true,
        InfoTooltip:      true,
        FixAvailableIcon: true,
      },
    },
  });
};

describe('MostSevereVulnerabilities.vue', () => {
  describe('computed: mostSevereVulnerabilities', () => {
    it('returns empty array if report is null', () => {
      const wrapper = createWrapper({ vulnerabilityReport: null });

      expect(wrapper.vm.mostSevereVulnerabilities).toEqual([]);
    });

    it('returns 5 empty placeholder objects if report empty', () => {
      const wrapper = createWrapper({ vulnerabilityReport: {} });

      expect(wrapper.vm.mostSevereVulnerabilities).toHaveLength(5);
      wrapper.vm.mostSevereVulnerabilities.forEach((v) => {
        expect(v).toEqual({
          cveId: '', score: '', severity: null, package: '', fixAvailable: null
        });
      });
    });

    it('uses fallback vulnerabilities if results are empty', () => {
      const wrapper = createWrapper({ vulnerabilityReport: fallbackReport });
      const computed = wrapper.vm.mostSevereVulnerabilities;

      expect(computed[0]).toMatchObject({
        cveId:        'CVE-FB-1',
        package:      'pkg-fb-1',
        score:        '8.8 (v3)',
        fixAvailable: true,
      });
      expect(computed).toHaveLength(5);
    });

    it('sorts vulnerabilities correctly by score/severity', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const ids = wrapper.vm.mostSevereVulnerabilities.map((v) => v.cveId);

      expect(ids).toEqual(['CVE-CRIT-1', 'CVE-CRIT-3', 'CVE-HIGH', 'CVE-CRIT-2', 'CVE-MED']);
    });

    it('formats each vulnerability correctly', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const first = wrapper.vm.mostSevereVulnerabilities[0];

      expect(first).toEqual({
        cveId:        'CVE-CRIT-1',
        score:        '9.8 (v3)',
        severity:     'critical',
        package:      'pkg-crit-1',
        fixAvailable: true,
      });
    });

    it('returns empty score when no v3score', () => {
      const wrapper = createWrapper({ vulnerabilityReport: reportWithNoScore });

      expect(wrapper.vm.mostSevereVulnerabilities[0].score).toBe('');
    });
  });

  describe('rendering', () => {
    it('renders correct RouterLink for first CVE', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);
      expect(link.text()).toBe('CVE-CRIT-1');
      const expectedPath = `/c/c-12345/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}/CVE-CRIT-1`;

      expect(link.props('to')).toBe(expectedPath);
    });

    it('renders ScoreBadge with proper props', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const scoreBadge = wrapper.findComponent('score-badge-stub');

      expect(scoreBadge.exists()).toBe(true);
      expect(scoreBadge.props('score')).toBe('9.8');
      expect(scoreBadge.props('scoreType')).toBe('v3');
      expect(scoreBadge.props('severity')).toBe('critical');
    });

    it('renders FixAvailableIcon with correct value', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const icons = wrapper.findAllComponents('fix-available-icon-stub');

      expect(icons.at(0).props('fixAvailable')).toBe(true);
      expect(icons.at(3).props('fixAvailable')).toBe(false);
    });

    it('renders rows equal to 5 vulnerabilities', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });

      expect(wrapper.findAll('.row')).toHaveLength(5);
    });
  });
});
