import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';

import PolicyServerDeployment from '@kubewarden/formatters/PolicyServerDeployment.vue';

const RouterLinkStub = {
  template: '<a><slot /></a>',
  props:    ['to']
};

const cleanTooltipDirective = {
  mounted() {},
  updated() {}
};

describe('PolicyServerDeployment.vue', () => {
  const createRow = (deployment: any, extra: Record<string, any> = {}) => {
    return {
      matchingDeployment: jest.fn().mockResolvedValue(deployment),
      detailLocation:     'detail/url',
      ...extra
    };
  };

  const factory = (props = {}) => {
    return mount(PolicyServerDeployment, {
      props,
      global: {
        stubs:      { 'router-link': RouterLinkStub },
        directives: { 'clean-tooltip': cleanTooltipDirective }
      }
    });
  };

  it('calls row.matchingDeployment on created and sets deployment', async() => {
    const fakeDeployment = [
      {
        status: {
          conditions: [{
            error:   false,
            type:    'Healthy',
            message: 'All good'
          }]
        }
      }
    ];
    const row = createRow(fakeDeployment);
    const wrapper = factory({
      row,
      value: 'Test Value'
    });

    await flushPromises();

    expect(row.matchingDeployment).toHaveBeenCalled();
    expect(wrapper.vm.deployment).toEqual(fakeDeployment);
  });

  describe('computed properties', () => {
    it('computes flattenedConditions and hasErrors correctly when errors exist', async() => {
      const conditions = [
        {
          error:   true,
          type:    'Warning',
          message: 'Something went wrong'
        },
        {
          error:   false,
          type:    'Info',
          message: 'All good'
        }
      ];
      const fakeDeployment = [
        { status: { conditions } }
      ];
      const row = createRow(fakeDeployment);
      const wrapper = factory({
        row,
        value: 'Test Value'
      });

      await flushPromises();

      // flattenedConditions uses flatMap over deployment array
      expect(wrapper.vm.flattenedConditions).toEqual(conditions);
      // hasErrors should filter out conditions with error === true
      expect(wrapper.vm.hasErrors).toBe(true);
      // formattedConditions creates HTML strings from error conditions.
      // The implementation pushes `<p><b>${ [c.type] }</b>: ${ c.message }</p>`
      // then calls .toString().replaceAll(',', '')
      const expectedFormatted = `<p><b>Warning</b>: Something went wrong</p>`;

      expect(wrapper.vm.formattedConditions).toBe(expectedFormatted);
    });

    it('computes formattedConditions as false when there are no errors', async() => {
      const conditions = [
        {
          error:   false,
          type:    'Healthy',
          message: 'All good'
        }
      ];
      const fakeDeployment = [
        { status: { conditions } }
      ];
      const row = createRow(fakeDeployment);
      const wrapper = factory({
        row,
        value: 'Test Value'
      });

      await flushPromises();

      expect(wrapper.vm.hasErrors).toBe(false);
      expect(wrapper.vm.formattedConditions).toBe(false);
    });

    it('computes "to" based on the reference prop when provided', async() => {
      // When a reference is provided, the component calls get(row, reference)
      // Here we simulate that by providing a row with a nested property.
      const row = createRow([], { nested: { link: '/nested/url' } });
      const wrapper = factory({
        row,
        reference: 'nested.link',
        value:     'Link Text'
      });

      await flushPromises();

      // Expect computed "to" to return the value at row.nested.link
      expect(wrapper.vm.to).toBe('/nested/url');
    });

    it('computes "to" from row.detailLocation when reference prop is not provided', async() => {
      const row = createRow([], { detailLocation: '/detail/url' });
      const wrapper = factory({
        row,
        value: 'Link Text'
      });

      await flushPromises();

      expect(wrapper.vm.to).toBe('/detail/url');
    });
  });

  describe('template rendering', () => {
    it('renders a router-link when "to" is truthy', async() => {
      const row = createRow([], { detailLocation: '/detail/url' });
      const wrapper = factory({
        row,
        value: 'Click Me'
      });

      await flushPromises();

      // Since "to" is computed from row.detailLocation, router-link should appear.
      const routerLink = wrapper.findComponent(RouterLinkStub);

      expect(routerLink.exists()).toBe(true);
      expect(routerLink.text()).toContain('Click Me');
      // Also, the :to prop should be set correctly.
      expect(routerLink.props('to')).toBe('/detail/url');
    });

    it('renders plain span when "to" is falsy', async() => {
      // If row does not have detailLocation and no reference is provided,
      // computed "to" will be undefined.
      const row = createRow([], { detailLocation: undefined });
      const wrapper = factory({
        row,
        value: 'No Link'
      });

      await flushPromises();

      // There should be no router-link; instead, a span with the value text.
      const routerLink = wrapper.findComponent(RouterLinkStub);

      expect(routerLink.exists()).toBe(false);
      expect(wrapper.find('span').text()).toBe('No Link');
    });

    it('renders an error icon with tooltip when there are errors', async() => {
      const conditions = [
        {
          error:   true,
          type:    'Critical',
          message: 'Failure detected'
        }
      ];
      const fakeDeployment = [
        { status: { conditions } }
      ];
      const row = createRow(fakeDeployment);
      const wrapper = factory({
        row,
        value: 'Error Value'
      });

      await flushPromises();

      // The <i> element should be rendered if hasErrors is true.
      const errorIcon = wrapper.find('i.conditions-alert-icon');

      expect(errorIcon.exists()).toBe(true);

      // Since v-clean-tooltip is a directive, we can't directly inspect its content,
      // but we can check that the element is present.
    });
  });
});
