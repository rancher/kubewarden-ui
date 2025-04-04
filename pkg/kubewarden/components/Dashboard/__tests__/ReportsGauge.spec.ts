import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';

import ReportsGauge from '@kubewarden/components/Dashboard/ReportsGauge.vue';

const BarStub = {
  name:  'Bar',
  props: ['percentage', 'primaryColor', 'secondaryColor'],
  render() {
    return h('div', { class: 'bar-stub' });
  }
};

const createWrapper = (overrides: any = {}) => {
  const defaultProps = {
    reports: {
      total:  100,
      status: {
        success: 70,
        fail:    30
      }
    }
  };

  return mount(ReportsGauge, {
    props:  {
      ...defaultProps,
      ...overrides.props
    },
    global: {
      stubs: {
        Bar: BarStub,
        ...overrides.global?.stubs
      },
      ...overrides.global
    },
    ...overrides
  });
};

describe('ReportsGauge.vue', () => {
  it('renders correct numbers and percentages when total is non-zero', async() => {
    const reports = {
      total:  100,
      status: {
        success: 70,
        fail:    30
      }
    };

    const wrapper = createWrapper({ props: { reports } });

    await flushPromises();

    const successStats = wrapper.find('.numbers-stats.success');

    expect(successStats.text()).toContain('70'); // reports.status.success
    expect(successStats.text()).toContain('Success');
    expect(successStats.text()).toContain('70%'); // formatted percentage

    const failStats = wrapper.find('.numbers-stats.fail');

    expect(failStats.text()).toContain('30'); // reports.status.fail
    expect(failStats.text()).toContain('Fail');
    expect(failStats.text()).toContain('30%');
  });

  it('computes percentageBarValue and secondaryColor correctly when total is non-zero', async() => {
    const reports = {
      total:  100,
      status: {
        success: 70,
        fail:    30
      }
    };

    const wrapper = createWrapper({ props: { reports } });

    await flushPromises();

    expect(wrapper.vm.percentageBarValue).toBe(70);

    // Since total is not 0, secondaryColor should be '--error'
    expect(wrapper.vm.secondaryColor).toBe('--error');

    expect(wrapper.vm.formattedPercentage('success')).toBe('70%');
    expect(wrapper.vm.formattedPercentage('fail')).toBe('30%');
  });

  it('passes the correct props to the Bar component', async() => {
    const reports = {
      total:  100,
      status: {
        success: 70,
        fail:    30
      }
    };

    const wrapper = createWrapper({ props: { reports } });

    await flushPromises();

    const barStub = wrapper.findComponent({ name: 'Bar' });

    expect(barStub.exists()).toBe(true);
    expect(barStub.props('percentage')).toBe(70);
    expect(barStub.props('primaryColor')).toBe('--success');
    expect(barStub.props('secondaryColor')).toBe('--error');
  });

  it('computes correct values and passes correct props when total is zero', async() => {
    const reports = {
      total:  0,
      status: {
        success: 0,
        fail:    0
      }
    };

    const wrapper = createWrapper({ props: { reports } });

    await flushPromises();

    // With total === 0, percentageBarValue should be 0 (as a number) and secondaryColor should be '--border'
    expect(wrapper.vm.percentageBarValue).toBe(0);
    expect(wrapper.vm.secondaryColor).toBe('--border');

    // The formattedPercentage method should return "0%" for any type.
    expect(wrapper.vm.formattedPercentage('success')).toBe('0%');
    expect(wrapper.vm.formattedPercentage('fail')).toBe('0%');

    const successStats = wrapper.find('.numbers-stats.success');

    expect(successStats.text()).toContain('0%');

    const failStats = wrapper.find('.numbers-stats.fail');

    expect(failStats.text()).toContain('0%');

    const barStub = wrapper.findComponent({ name: 'Bar' });

    expect(barStub.props('percentage')).toBe(0);
    expect(barStub.props('secondaryColor')).toBe('--border');
  });
});
