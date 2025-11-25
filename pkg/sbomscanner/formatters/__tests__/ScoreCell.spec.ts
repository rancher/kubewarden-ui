import { shallowMount } from '@vue/test-utils';
import ScoreCell from '../ScoreCell.vue';
import ScoreBadge from '../../components/common/ScoreBadge.vue';

describe('ScoreCell.vue', () => {
  it('renders ScoreBadge with parsed score, type, and severity when score is present', () => {
    const mockRow = {
      score:    '8.2 (v3)',
      severity: 'High',
    };

    const wrapper = shallowMount(ScoreCell, { props: { row: mockRow } });

    const scoreBadge = wrapper.findComponent(ScoreBadge);

    expect(scoreBadge.exists()).toBe(true);

    // Check that props were passed correctly after parsing
    expect(scoreBadge.props('score')).toBe('8.2');
    expect(scoreBadge.props('scoreType')).toBe('v3');
    expect(scoreBadge.props('severity')).toBe('High');
  });

  it.each([
    { score: null, severity: 'Low' },
    { score: undefined, severity: 'Medium' },
    { score: '', severity: 'Critical' },
    { score: '   ', severity: 'High' },
  ])('renders ScoreBadge with empty score and type when score is missing (%o)', (mockRow) => {
    const wrapper = shallowMount(ScoreCell, { props: { row: mockRow } });

    const scoreBadge = wrapper.findComponent(ScoreBadge);

    expect(scoreBadge.exists()).toBe(true);

    // For missing score, both score and scoreType should be empty
    expect(scoreBadge.props('score')).toBe('');
    expect(scoreBadge.props('scoreType')).toBe('');
    expect(scoreBadge.props('severity')).toBe(mockRow.severity);
  });

  it('renders correctly inside container div with padding', () => {
    const wrapper = shallowMount(ScoreCell, { props: { row: { score: '5.0 (v3)', severity: 'Low' } } });

    const div = wrapper.find('div');

    expect(div.attributes('style')).toContain('padding-right: 32px;');
  });
});
