import { shallowMount } from '@vue/test-utils';
import ScoreCell from '../ScoreCell.vue';
import ScoreBadge from '../../components/common/ScoreBadge.vue';

describe('ScoreCell.vue', () => {
  it('should render ScoreBadge with correct props when score is present', () => {
    const mockRow = {
      score:    '8.2 (v3)',
      severity: 'High',
    };

    const wrapper = shallowMount(ScoreCell, { props: { row: mockRow } });

    const scoreBadge = wrapper.findComponent(ScoreBadge);

    expect(scoreBadge.exists()).toBe(true);

    expect(scoreBadge.props('score')).toBe(8.2);
    expect(scoreBadge.props('scoreType')).toBe('v3');
    expect(scoreBadge.props('severity')).toBe('High');

    expect(wrapper.find('.na-badge').exists()).toBe(false);
  });

  it.each([
    { score: null, severity: 'Low' },
    { score: undefined, severity: 'Medium' },
    { score: '', severity: 'Critical' },
    { score: '   ', severity: 'High' },
  ])('should render "n/a" badge when score is not present', (mockRow) => {
    const wrapper = shallowMount(ScoreCell, { props: { row: mockRow } });

    const naBadge = wrapper.find('.na-badge');

    expect(naBadge.exists()).toBe(true);
    expect(naBadge.text()).toBe('n/a');

    expect(wrapper.findComponent(ScoreBadge).exists()).toBe(false);
  });
});
