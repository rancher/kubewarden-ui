import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import VexDateFormatter from '../VexDateFormatter.vue';

describe('VexDateFormatter.vue', () => {
  let localeStringSpy;

  beforeEach(() => {
    localeStringSpy = jest
      .spyOn(Date.prototype, 'toLocaleString')
      .mockReturnValue('Mocked Formatted Date');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the formatted date returned by toLocaleString', () => {
    const mockDateString = '2025-10-20T18:00:00Z';
    const wrapper = shallowMount(VexDateFormatter, { props: { value: mockDateString } });

    expect(wrapper.text()).toBe('Mocked Formatted Date');
  });

  it('should call toLocaleString with the correct locale and options', () => {
    const mockDateString = '2025-10-20T18:00:00Z';
    const mockDateObject = new Date(mockDateString);

    shallowMount(VexDateFormatter, { props: { value: mockDateObject } });

    const expectedOptions = {
      month:  'short',
      day:    'numeric',
      year:   'numeric',
      hour:   'numeric',
      minute: '2-digit',
      hour12: true,
    };

    expect(localeStringSpy).toHaveBeenCalledTimes(1);
    expect(localeStringSpy).toHaveBeenCalledWith('en-US', expectedOptions);
  });
});
