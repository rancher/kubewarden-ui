import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';

import ReporterPanel from '@kubewarden/components/PolicyReporter/ReporterPanel.vue';
import { getReports } from '@kubewarden/modules/policyReporter';

// Mock the getReports function so we can spy on its calls.
jest.mock('@kubewarden/modules/policyReporter', () => ({ getReports: jest.fn(() => Promise.resolve([])) }));

describe('ReporterPanel.vue', () => {
  let storeMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    storeMock = { commit: jest.fn() };
  });

  it('renders the reporter panel', () => {
    const wrapper = mount(ReporterPanel, {
      global: {
        provide: { store: storeMock },
        mocks:   {
          $route: {
            params: {},
            path:   '/somepath'
          }
        }
      }
    });

    expect(wrapper.find('.reporter-panel').exists()).toBe(true);
  });

  it('fetches cluster policy reports when no resource param is provided', async() => {
    const $route = {
      params: {},
      path:   '/somepath'
    };

    mount(ReporterPanel, {
      global: {
        provide: { store: storeMock },
        mocks:   { $route }
      }
    });

    // Wait for onMounted and async tasks to finish.
    await flushPromises();
    await nextTick();

    // For a route with no "resource" parameter and a path not including "projectsnamespaces":
    // - The first condition (cluster level) should trigger a call to getReports with clusterLevel true.
    // - The second condition is false because there is no resource param and the path does not include "projectsnamespaces".
    expect(getReports).toHaveBeenCalledTimes(1);
    expect(getReports).toHaveBeenCalledWith(storeMock, true);
    // Verify that loading is turned on then off.
    expect(storeMock.commit).toHaveBeenCalledWith('kubewarden/updateLoadingReports', true);
    expect(storeMock.commit).toHaveBeenCalledWith('kubewarden/updateLoadingReports', false);
  });

  it('fetches resource-specific policy reports when resource param is provided', async() => {
    const $route = {
      params: { resource: 'pod' },
      path:   '/pods'
    };

    mount(ReporterPanel, {
      global: {
        provide: { store: storeMock },
        mocks:   { $route }
      }
    });

    await flushPromises();
    await nextTick();

    // With a resource parameter, the first condition is false and the second condition triggers.
    expect(getReports).toHaveBeenCalledTimes(1);
    expect(getReports).toHaveBeenCalledWith(storeMock, false, 'pod');
    expect(storeMock.commit).toHaveBeenCalledWith('kubewarden/updateLoadingReports', true);
    expect(storeMock.commit).toHaveBeenCalledWith('kubewarden/updateLoadingReports', false);
  });

  it('fetches both cluster and resource-specific policy reports when path includes "projectsnamespaces"', async() => {
    const $route = {
      params: {},
      path:   '/projectsnamespaces'
    };

    mount(ReporterPanel, {
      global: {
        provide: { store: storeMock },
        mocks:   { $route }
      }
    });

    await flushPromises();
    await nextTick();

    // When the path includes "projectsnamespaces", both conditions are met:
    // - The cluster-level call.
    // - The resource-specific call (with resourceType undefined).
    expect(getReports).toHaveBeenCalledTimes(2);
    expect(getReports).toHaveBeenNthCalledWith(1, storeMock, true);
    expect(getReports).toHaveBeenNthCalledWith(2, storeMock, false, undefined);
    expect(storeMock.commit).toHaveBeenCalledWith('kubewarden/updateLoadingReports', true);
    expect(storeMock.commit).toHaveBeenCalledWith('kubewarden/updateLoadingReports', false);
  });

  it('does not fetch policies if $route is not available', async() => {
    // Simulate absence of $route by providing undefined.
    mount(ReporterPanel, {
      global: {
        provide: { store: storeMock },
        mocks:   { $route: undefined }
      }
    });

    await flushPromises();
    await nextTick();

    // In this case, onMounted should exit early because no $route was found.
    expect(getReports).not.toHaveBeenCalled();
    // updateLoadingReports(true) is still called at the start but updateLoadingReports(false) is not committed.
    expect(storeMock.commit).toHaveBeenCalledWith('kubewarden/updateLoadingReports', true);
    expect(storeMock.commit).not.toHaveBeenCalledWith('kubewarden/updateLoadingReports', false);
  });
});
