import { shallowMount } from '@vue/test-utils';
import ScoreBadge from '../ScoreBadge.vue';
import { SEVERITY } from '@sbomscanner/types/image';

jest.mock('@sbomscanner/types/image', () => ({
  SEVERITY: {
    CRITICAL: 'critical',
    HIGH:     'high',
    MEDIUM:   'medium',
    LOW:      'low',
  }
}));

describe('ScoreBadge.vue', () => {
  describe('Display Text', () => {
    it('displays "n/a" when no score or scoreType are provided', () => {
      const wrapper = shallowMount(ScoreBadge);

      expect(wrapper.text().trim()).toBe('n/a');
    });

    it('displays "7.5" when only score is provided', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { score: '7.5' } });

      expect(wrapper.text().trim()).toBe('7.5');
    });

    it('displays empty when only scoreType is provided', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { scoreType: '' } });

      expect(wrapper.text().trim()).toBe('n/a');
    });

    it('displays formatted score and type when both are provided', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { score: '8.1', scoreType: 'v3' } });

      expect(wrapper.text().trim()).toBe('8.1 (v3)');
    });
  });

  describe('Severity Classes (computedSeverity)', () => {
    it('applies class "na" when severity is not provided', () => {
      const wrapper = shallowMount(ScoreBadge);

      expect(wrapper.classes()).toContain('na');
    });

    it('applies class "critical" for CRITICAL severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'critical' } });

      expect(wrapper.classes()).toContain(SEVERITY.CRITICAL);
    });

    it('is case-insensitive for "Critical"', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'Critical' } });

      expect(wrapper.classes()).toContain(SEVERITY.CRITICAL);
    });

    it('applies class "high" for HIGH severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'high' } });

      expect(wrapper.classes()).toContain(SEVERITY.HIGH);
    });

    it('applies class "medium" for MEDIUM severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'medium' } });

      expect(wrapper.classes()).toContain(SEVERITY.MEDIUM);
    });

    it('applies class "low" for LOW severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'low' } });

      expect(wrapper.classes()).toContain(SEVERITY.LOW);
    });

    it('applies class "na" for unknown severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'unknown' } });

      expect(wrapper.classes()).toContain('na');
    });
  });
});
