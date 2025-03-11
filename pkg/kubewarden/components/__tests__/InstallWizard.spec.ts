import { mount } from '@vue/test-utils';
import { h } from 'vue';

import InstallWizard from '@kubewarden/components/InstallWizard.vue';

describe('InstallWizard.vue', () => {
  const steps = [
    {
      name:  'step1',
      label: 'Step 1',
      ready: true
    },
    {
      name:  'step2',
      label: 'Step 2',
      ready: true
    },
    {
      name:  'step3',
      label: 'Step 3',
      ready: true
    },
    {
      name:  'step4',
      label: 'Step 4',
      ready: true
    }
  ];

  const factory = (props = {}, options: any = {}) => {
    return mount(InstallWizard, {
      props: {
        steps,
        ...props
      },
      global: {
        mocks: { t: (key: string) => key },
        ...options.global
      },
      slots: options.slots || {}
    });
  };

  it('sets activeStep to the step at initStepIndex on created', () => {
    const wrapper = factory({ initStepIndex: 2 });

    expect(wrapper.vm.activeStep).toEqual(steps[2]);
  });

  it('computed activeStepIndex returns the correct index', async() => {
    const wrapper = factory({ initStepIndex: 1 });

    expect(wrapper.vm.activeStepIndex).toBe(1);
    // Change activeStep manually and check update
    wrapper.vm.activeStep = steps[3];
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.activeStepIndex).toBe(3);
  });

  describe('methods', () => {
    describe('isAvailable', () => {
      it('returns false for the first step', () => {
        const wrapper = factory();

        expect(wrapper.vm.isAvailable(steps[0])).toBe(false);
      });

      it('returns false if any previous step is not ready', () => {
        const modifiedSteps = [
          {
            name:  'step1',
            label: 'Step 1',
            ready: true
          },
          {
            name:  'step2',
            label: 'Step 2',
            ready: false
          },
          {
            name:  'step3',
            label: 'Step 3',
            ready: true
          }
        ];
        const wrapper = mount(InstallWizard, {
          props: {
            steps:         modifiedSteps,
            initStepIndex: 0
          },
          global: { mocks: { t: (key: string) => key } }
        });

        // step3 should not be available because step2 is not ready
        expect(wrapper.vm.isAvailable(modifiedSteps[2])).toBe(false);
      });

      it('returns true if all previous steps are ready', () => {
        const wrapper = factory();

        expect(wrapper.vm.isAvailable(steps[2])).toBe(true);
      });
    });

    describe('goToStep', () => {
      let wrapper: any;

      beforeEach(() => {
        wrapper = factory({ initStepIndex: 0 });
      });

      it('does nothing if number < 1', () => {
        wrapper.vm.goToStep(0, false);
        expect(wrapper.vm.activeStep).toEqual(steps[0]);
      });

      it('does nothing if number === 1 and fromNav is true', () => {
        wrapper.vm.goToStep(1, true);
        expect(wrapper.vm.activeStep).toEqual(steps[0]);
      });

      it('does nothing if the selected step is not available (not ready) and number !== 1', async() => {
        const modifiedSteps = [
          {
            name:  'step1',
            label: 'Step 1',
            ready: false
          },
          {
            name:  'step2',
            label: 'Step 2',
            ready: false
          },
          {
            name:  'step3',
            label: 'Step 3',
            ready: true
          }
        ];

        wrapper.setProps({ steps: modifiedSteps });
        await wrapper.vm.$nextTick();
        wrapper.vm.goToStep(2, false); // Attempt to go to step2
        expect(wrapper.vm.activeStep.name).toEqual(modifiedSteps[0].name); // Remains on first step
      });

      it('updates activeStep and emits "next" event when a valid step is selected', () => {
        wrapper.vm.goToStep(2, false); // Should go to step at index 1
        expect(wrapper.vm.activeStep).toEqual(steps[1]);
        expect(wrapper.emitted().next).toBeTruthy();
        expect(wrapper.emitted().next[0][0]).toEqual({ step: steps[1] });
      });
    });

    describe('next', () => {
      it('calls goToStep with activeStepIndex + 2', () => {
        const wrapper = factory({ initStepIndex: 0 });

        jest.spyOn(wrapper.vm, 'goToStep');
        wrapper.vm.next();
        expect(wrapper.vm.goToStep).toHaveBeenCalledWith(2);
      });
    });
  });

  // Template Rendering
  describe('template rendering', () => {
    it('renders title block when showTitle is true', () => {
      const wrapper = factory({ showTitle: true });

      expect(wrapper.find('.product-image img.logo').exists()).toBe(true);
    });

    it('does not render title block when showTitle is false', () => {
      const wrapper = factory({ showTitle: false });

      expect(wrapper.find('.product-image img.logo').exists()).toBe(false);
    });

    it('renders the step-sequence when more than one step is provided', () => {
      const wrapper = factory();

      expect(wrapper.find('.step-sequence').exists()).toBe(true);
      const listItems = wrapper.findAll('.steps li.step');

      expect(listItems.length).toBe(steps.length);
    });

    it('applies "active" class to the active step and "disabled" class to unavailable steps', async() => {
      // Initially, activeStep is steps[0] (which is always unavailable per isAvailable)
      const wrapper = factory();
      const firstStep = wrapper.find(`li#${  steps[0].name }`);

      expect(firstStep.classes()).toContain('active');
      expect(firstStep.classes()).toContain('disabled');
      // Simulate clicking on step 2
      const step2 = wrapper.find(`li#${  steps[1].name }`);

      await step2.find('.controls').trigger('click.prevent');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.activeStep).toEqual(steps[1]);
    });

    it('renders slot "bannerSubtext" when provided', async() => {
      const wrapper = factory({}, { slots: { bannerSubtext: `<span class="custom-banner">Custom Banner</span>` } });

      await wrapper.vm.$nextTick();
      const customBanner = wrapper.find('.custom-banner');

      expect(customBanner.exists()).toBe(true);
      expect(customBanner.text()).toBe('Custom Banner');
    });

    it('renders the step-container slot for the active step using a scoped slot function', async() => {
      const wrapper = factory(
        { initStepIndex: 0 },
        {
          slots: {
            // Return a VNode instead of a plain string.
            'stepContainer mt-20': (slotProps: { activeStep: { label: string } }) => h('div', { class: 'step-slot' }, slotProps.activeStep.label)
          }
        }
      );

      await wrapper.vm.$nextTick();

      const slotDiv = wrapper.find('.step-slot');

      expect(slotDiv.exists()).toBe(true);
      expect(slotDiv.text()).toBe(steps[0].label);
    });
  });
});
