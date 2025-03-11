import { mount } from '@vue/test-utils';

import ResourceDisplayComponent from '@kubewarden/formatters/PolicyResources.vue';

describe('ResourceDisplayComponent', () => {
  it('renders no labels when the value prop is empty', async() => {
    const wrapper = mount(ResourceDisplayComponent, {
      props: {
        col:   { name: 'field' },
        value: []
      }
    });

    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).resourceToShow).toEqual([]);
    expect((wrapper.vm as any).resourceLabels).toEqual([]);
    expect(wrapper.findAll('span').length).toBe(0);
  });

  it('sets resourceToShow with unique values from the value prop', async() => {
    const testValue = [
      { field: 'A' },
      { field: 'B' },
      { field: 'A' },
      { field: 'C' },
      { field: 'B' }
    ];

    const wrapper = mount(ResourceDisplayComponent, {
      props: {
        col:   { name: 'field' },
        value: testValue
      }
    });

    await wrapper.vm.$nextTick();

    // Unique values should be ['A', 'B', 'C']
    expect((wrapper.vm as any).resourceToShow).toEqual(['A', 'B', 'C']);
  });

  it('computes resourceLabels correctly for a single value', async() => {
    const testValue = [
      { field: 'OnlyValue' }
    ];

    const wrapper = mount(ResourceDisplayComponent, {
      props: {
        col:   { name: 'field' },
        value: testValue
      }
    });

    await wrapper.vm.$nextTick();

    // When only one value is present, resourceLabels should equal resourceToShow
    expect((wrapper.vm as any).resourceToShow).toEqual(['OnlyValue']);
    expect((wrapper.vm as any).resourceLabels).toEqual(['OnlyValue']);

    // Rendered output should include one span with the text "OnlyValue"
    const spans = wrapper.findAll('span');

    expect(spans.length).toBe(1);
    expect(spans[0].text()).toBe('OnlyValue');
  });

  it('computes resourceLabels correctly for multiple values', async() => {
    const testValue = [
      { field: 'A' },
      { field: 'B' },
      { field: 'C' }
    ];

    const wrapper = mount(ResourceDisplayComponent, {
      props: {
        col:   { name: 'field' },
        value: testValue
      }
    });

    await wrapper.vm.$nextTick();

    // resourceToShow should be unique values ['A', 'B', 'C']
    expect((wrapper.vm as any).resourceToShow).toEqual(['A', 'B', 'C']);

    // When more than one value is present, computed resourceLabels adds a comma and space after every value except the last.
    // Expected: ["A, ", "B, ", "C"]
    expect((wrapper.vm as any).resourceLabels).toEqual(['A, ', 'B, ', 'C']);

    // Rendered output should include three spans with corresponding text.
    const spans = wrapper.findAll('span');

    expect(spans.length).toBe(3);
    expect(spans[0].text()).toBe('A,');
    expect(spans[1].text()).toBe('B,');
    expect(spans[2].text()).toBe('C');
  });

  it('handles missing value prop gracefully', async() => {
    // When the value prop is omitted, the default is an empty array.
    const wrapper = mount(ResourceDisplayComponent, { props: { col: { name: 'field' } } });

    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).resourceToShow).toEqual([]);
    expect((wrapper.vm as any).resourceLabels).toEqual([]);
  });
});
