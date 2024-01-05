import Vue from 'vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

interface WrapperOptions {
  propsData?: { [key: string]: any };
  computed?: { [key: string]: any };
  mocks?: { [key: string]: any };
  stubs?: { [key: string]: any };
}

export const createWrapper = (Component: typeof Vue, commonMocks: any, commonComputed: any, defaultPropsData = {}) => {
  const localVue = createLocalVue();

  localVue.use(Vuex);

  return (overrides: WrapperOptions = {}) => {
    const mergedPropsData = {
      ...defaultPropsData,
      ...overrides.propsData,
    };

    const mountOptions = {
      localVue,
      ...overrides,
      propsData: mergedPropsData,
      computed:  {
        ...commonComputed,
        ...overrides.computed,
      },
      mocks: {
        ...commonMocks,
        ...overrides.mocks,
      },
    };

    return shallowMount(Component, mountOptions);
  };
};
