import Vue from 'vue';
import {
  shallowMount,
  createLocalVue,
  ThisTypedShallowMountOptions,
} from '@vue/test-utils';
import Vuex from 'vuex';

type VueComponent = typeof Vue | Vue.VueConstructor;

interface ExtendedMountOptions<V extends Vue>
  extends ThisTypedShallowMountOptions<V> {
  [key: string]: any;
}

/**
 * Creates a wrapper factory function for a given component and common options.
 *
 * @param Component - The Vue component to be mounted. This can be a Vue component object or a constructor.
 * @param commons - A set of default options to be applied to the component during mounting. These can include
 *                  propsData, computed properties, methods, stubs, mocks, and any other Vue Test Utils options.
 *                  Custom properties specific to your component can also be included.
 * @returns A function that takes an object of type `ExtendedMountOptions<Vue>` as an optional parameter
 *          for providing overrides or additional options to the shallowMount call. This function returns
 *          a Wrapper<Vue> instance, which is the mounted component wrapper that can be used for testing.
 *
 * Usage example:
 * const defaultOptions = {
 *   propsData: { propA: 'value1' },
 *   computed: { computedB: () => 'value2' }
 * };
 * const wrapperFactory = createWrapper(MyComponent, defaultOptions);
 * const wrapper = wrapperFactory({ propsData: { propA: 'overrideValue' } });
 */
export const createWrapper = (
  Component: VueComponent,
  commons: ExtendedMountOptions<Vue> = {}
) => {
  const localVue = createLocalVue();

  localVue.use(Vuex);

  return (overrides: ExtendedMountOptions<Vue> = {}) => {
    // Merge the common options with any overrides provided at the call time.
    const mountOptions: ExtendedMountOptions<Vue> = {
      localVue,
      ...commons, // Apply common/default settings.
      ...overrides, // Allow specific test cases to override or extend the settings.
    };

    return shallowMount(Component, mountOptions);
  };
};
