import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import ScanButton from '../ScanButton.vue';

// Mock dependencies
jest.mock('@sbomscanner/types', () => ({ RESOURCE: { SCAN_JOB: 'sbom.cisco.com.scanjob' } }));

describe('ScanButton.vue', () => {
  let wrapper;
  let mockDispatch;
  let mockT;
  let mockReloadFn;
  let mockSave;
  let mockScanJob;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSave = jest.fn();
    mockScanJob = { save: mockSave };

    mockDispatch = jest.fn((type) => {
      if (type === 'cluster/create') {
        return Promise.resolve(mockScanJob);
      }

      return Promise.resolve();
    });

    mockT = jest.fn((key) => {
      if (key === 'imageScanner.registries.button.startScan') {
        return 'Start Scan';
      }

      return key;
    });

    mockReloadFn = jest.fn();
  });

  const mountComponent = (selectedRegistries = []) => {
    wrapper = shallowMount(ScanButton, {
      propsData: {
        selectedRegistries,
        reloadFn: mockReloadFn
      },
      global: {
        mocks: {
          $store: { dispatch: mockDispatch },
          t:      mockT
        }
      }
    });
  };

  it('should render the button with correct text', () => {
    mountComponent();
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Start Scan');
    expect(wrapper.find('i.icon-play').exists()).toBe(true);
  });

  it('should be disabled if selectedRegistries is empty', () => {
    mountComponent([]);
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should be enabled if selectedRegistries is not empty', () => {
    mountComponent([{ name: 'reg1', namespace: 'ns1' }]);
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('should not do anything on click if disabled', async() => {
    mountComponent([]);
    await wrapper.find('button').trigger('click');

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockReloadFn).not.toHaveBeenCalled();
  });

  it('should dispatch cluster/create, save, show success, and reload for each registry on click', async() => {
    const registries = [
      { name: 'reg1', namespace: 'ns1' },
      { name: 'reg2', namespace: 'ns2' }
    ];

    mockSave.mockResolvedValue({}); // Simulate successful save

    mountComponent(registries);

    await wrapper.find('button').trigger('click');

    // Wait for all async operations in the loop to settle
    await new Promise(jest.requireActual('timers').setImmediate);

    // Check cluster/create calls
    expect(mockDispatch).toHaveBeenCalledWith('cluster/create', {
      type:     'sbom.cisco.com.scanjob',
      metadata: {
        generateName: 'reg1',
        namespace:    'ns1',
      },
      spec: { registry: 'reg1' }
    });
    expect(mockDispatch).toHaveBeenCalledWith('cluster/create', {
      type:     'sbom.cisco.com.scanjob',
      metadata: {
        generateName: 'reg2',
        namespace:    'ns2',
      },
      spec: { registry: 'reg2' }
    });

    // Check save calls
    expect(mockSave).toHaveBeenCalledTimes(2);

    // Check growl/success calls
    expect(mockDispatch).toHaveBeenCalledWith('growl/success', expect.any(Object));
    expect(mockDispatch).toHaveBeenCalledTimes(4); // 2 for create, 2 for success

    // Check reloadFn calls
    expect(mockReloadFn).toHaveBeenCalledTimes(2);
  });

  it('should dispatch growl/error and reload if save fails', async() => {
    const registries = [{ name: 'reg-fail', namespace: 'ns-fail' }];
    const error = new Error('Save Failed');

    mockSave.mockRejectedValue(error); // Simulate failed save

    mountComponent(registries);

    await wrapper.find('button').trigger('click');

    await new Promise(jest.requireActual('timers').setImmediate);

    // Check cluster/create
    expect(mockDispatch).toHaveBeenCalledWith('cluster/create', expect.any(Object));

    // Check save
    expect(mockSave).toHaveBeenCalledTimes(1);

    // Check growl/error
    expect(mockDispatch).toHaveBeenCalledWith('growl/error', {
      title:   'imageScanner.registries.messages.registryScanFailed',
      message: 'Save Failed',
    });
    expect(mockDispatch).not.toHaveBeenCalledWith('growl/success', expect.any(Object));

    // Check reloadFn (should still be called in finally)
    expect(mockReloadFn).toHaveBeenCalledTimes(1);
  });
});
