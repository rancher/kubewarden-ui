import { shallowMount } from '@vue/test-utils';
import ScoreBadgeCell from '../ScoreBadgeCell.vue';
import ScoreBadge from '@sbomscanner/components/common/ScoreBadge.vue';

describe('ScoreBadgeCell.vue', () => {
  it('should render ScoreBadge and pass the score and score-type props', () => {
    const mockScore = '8.2';

    const wrapper = shallowMount(ScoreBadgeCell, { props: { value: mockScore } });

    const scoreBadgeComponent = wrapper.findComponent(ScoreBadge);

    expect(scoreBadgeComponent.exists()).toBe(true);

    expect(scoreBadgeComponent.props('score')).toBe(mockScore);
    expect(scoreBadgeComponent.props('scoreType')).toBe('v3');
  });
});
