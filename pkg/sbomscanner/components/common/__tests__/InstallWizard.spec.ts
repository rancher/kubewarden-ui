import { shallowMount } from '@vue/test-utils';
import InstallWizard from '../InstallWizard.vue';

const $t = (key) => key;

const mockSteps = [
  {
    name: 'step1', label: 'Step 1', ready: true
  },
  {
    name: 'step2', label: 'Step 2', ready: false
  },
  {
    name: 'step3', label: 'Step 3', ready: false
  },
];

const factory = (propsData) => {
  return shallowMount(InstallWizard, {
    propsData: {
      steps: mockSteps,
      ...propsData,
    },
    global: { mocks: { $t } },
  });
};

describe('InstallWizard.vue', () => {
  describe('Initialization and Props', () => {
    it('should mount and set the active step to initStepIndex', () => {
      const wrapper = factory();

      expect(wrapper.vm.activeStep).toStrictEqual(mockSteps[0]); // <-- FIX
      expect(wrapper.vm.activeStepIndex).toBe(0);
    });

    it('should set active step based on non-default initStepIndex', () => {
      const wrapper = factory({ initStepIndex: 1 });

      expect(wrapper.vm.activeStep).toStrictEqual(mockSteps[1]); // <-- FIX
      expect(wrapper.vm.activeStepIndex).toBe(1);
    });

    it('should show the title by default', () => {
      const wrapper = factory();

      expect(wrapper.find('.product').exists()).toBe(true);
    });

    it('should hide the title when showTitle is false', () => {
      const wrapper = factory({ showTitle: false });

      expect(wrapper.find('.product').exists()).toBe(false);
    });

    it('should show the step sequence if steps length is greater than 1', () => {
      const wrapper = factory();

      expect(wrapper.find('.step-sequence').exists()).toBe(true);
    });

    it('should hide the step sequence if steps length is 1', () => {
      const wrapper = factory({ steps: [mockSteps[0]] });

      expect(wrapper.find('.step-sequence').exists()).toBe(false);
    });
  });

  describe('Method: isAvailable', () => {
    it('should correctly determine if a step is available', () => {
      const steps = [
        { name: 's1', ready: true },
        { name: 's2', ready: false },
        { name: 's3', ready: false },
      ];
      const wrapper = factory({ steps });

      expect(wrapper.vm.isAvailable(steps[0])).toBe(false);
      expect(wrapper.vm.isAvailable(steps[1])).toBe(true);
      expect(wrapper.vm.isAvailable(steps[2])).toBe(false);
    });

    it('should update availability when previous steps change', () => {
      const steps = [
        { name: 's1', ready: false },
        { name: 's2', ready: false },
        { name: 's3', ready: false },
      ];
      const wrapper = factory({ steps });

      expect(wrapper.vm.isAvailable(steps[1])).toBe(false);
      expect(wrapper.vm.isAvailable(steps[2])).toBe(false);

      steps[0].ready = true;
      expect(wrapper.vm.isAvailable(steps[1])).toBe(true);
      expect(wrapper.vm.isAvailable(steps[2])).toBe(false);

      steps[1].ready = true;
      expect(wrapper.vm.isAvailable(steps[2])).toBe(true);
    });
  });

  describe('Method: goToStep', () => {
    it('should go to a step if confirmedReady is true, even if not available', () => {
      const steps = [
        { name: 's1', ready: false },
        { name: 's2', ready: false },
        { name: 's3', ready: false },
      ];
      const wrapper = factory({ steps });

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX

      wrapper.vm.goToStep(3, true);

      expect(wrapper.vm.activeStep).toStrictEqual(steps[2]); // <-- FIX
      expect(wrapper.emitted('next')).toBeTruthy();
      expect(wrapper.emitted('next')[0]).toEqual([{ step: steps[2] }]);
    });

    it('should go to a step if not confirmed but is available', () => {
      const steps = [
        { name: 's1', ready: true },
        { name: 's2', ready: false },
      ];
      const wrapper = factory({ steps });

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX

      wrapper.vm.goToStep(2, false);

      expect(wrapper.vm.activeStep).toStrictEqual(steps[1]); // <-- FIX
      expect(wrapper.emitted('next')).toBeTruthy();
    });

    it('should not go to a step if not confirmed and not available', () => {
      const steps = [
        { name: 's1', ready: false },
        { name: 's2', ready: false },
      ];
      const wrapper = factory({ steps });

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX

      wrapper.vm.goToStep(2, false);

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX
      expect(wrapper.emitted('next')).toBeFalsy();
    });

    it('should not go to step 1 from nav', () => {
      const wrapper = factory({ initStepIndex: 1 });

      expect(wrapper.vm.activeStep).toStrictEqual(mockSteps[1]); // <-- FIX

      wrapper.vm.goToStep(1, false, true);

      expect(wrapper.vm.activeStep).toStrictEqual(mockSteps[1]); // <-- FIX
    });

    it('should not navigate if step number is less than 1', () => {
      const wrapper = factory();

      expect(wrapper.vm.activeStep).toStrictEqual(mockSteps[0]); // <-- FIX

      wrapper.vm.goToStep(0);

      expect(wrapper.vm.activeStep).toStrictEqual(mockSteps[0]); // <-- FIX
    });
  });

  describe('Method: next', () => {
    it('should advance to the next step if available', () => {
      const steps = [
        { name: 's1', ready: true },
        { name: 's2', ready: false },
      ];
      const wrapper = factory({ steps });

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX

      wrapper.vm.next();

      expect(wrapper.vm.activeStep).toStrictEqual(steps[1]); // <-- FIX
    });

    it('should not advance to the next step if not available', () => {
      const steps = [
        { name: 's1', ready: false },
        { name: 's2', ready: false },
      ];
      const wrapper = factory({ steps });

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX

      wrapper.vm.next();

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX
    });
  });

  describe('DOM Interaction and State', () => {
    it('should apply active and disabled classes correctly', () => {
      const steps = [
        { name: 's1', ready: true },
        { name: 's2', ready: false },
        { name: 's3', ready: false },
      ];
      const wrapper = factory({ steps });
      const stepsLi = wrapper.findAll('li.step');

      expect(stepsLi[0].classes('active')).toBe(true);
      expect(stepsLi[1].classes('active')).toBe(false);
      expect(stepsLi[2].classes('active')).toBe(false);

      expect(stepsLi[0].classes('disabled')).toBe(true); // <-- FIX
      expect(stepsLi[1].classes('disabled')).toBe(false);
      expect(stepsLi[2].classes('disabled')).toBe(true);
    });

    it('should change active step on nav click', async() => {
      const steps = [
        { name: 's1', ready: true },
        { name: 's2', ready: false },
        { name: 's3', ready: false },
      ];
      const wrapper = factory({ steps });
      const navItems = wrapper.findAll('.step .controls');

      expect(wrapper.vm.activeStep).toStrictEqual(steps[0]); // <-- FIX

      await navItems[2].trigger('click');

      expect(wrapper.vm.activeStep).toStrictEqual(steps[2]); // <-- FIX
      expect(wrapper.emitted('next')).toBeTruthy();
      expect(wrapper.emitted('next')[0]).toEqual([{ step: steps[2] }]);
    });
  });
});
