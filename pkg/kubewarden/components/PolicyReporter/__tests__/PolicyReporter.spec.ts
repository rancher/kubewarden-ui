import { mount } from '@vue/test-utils';

import PolicyReporter from '@kubewarden/components/PolicyReporter/index.vue';

import mockControllerDeployment from '@/tests/unit/mocks/controllerDeployment';
import { KUBEWARDEN, WG_POLICY_K8S } from '@kubewarden/types';

// Create a mock for the 'cluster/schemaFor' getter that returns different values based on the input.
const clusterSchemaFor = jest.fn((resourceType) => {
  switch (resourceType) {
  case KUBEWARDEN.POLICY_SERVER:
    return true;
  case WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE:
    return true;
  case WG_POLICY_K8S.POLICY_REPORT.TYPE:
    return true;
  default:
    return false;
  }
});

const commonMocks = {
  $fetchState: { pending: false },
  $store:      {
    getters: {
      currentCluster:               () => 'current_cluster',
      currentStore:                 () => 'cluster',
      'cluster/all':                () => [mockControllerDeployment],
      'cluster/canList':            jest.fn,
      'cluster/schemaFor':          clusterSchemaFor,
      'i18n/t':                     jest.fn(),
      'management/byId':            () => 'local',
      'resource-fetch/refreshFlag': jest.fn()
    }
  },
  $route: { params: { cluster: '_' } }
};

const commonStubs = { 'router-link': { template: '<span />' } };

const commonData = {
  isAdminUser: true,
  permissions: {
    policyServer:           true,
    admissionPolicy:        true,
    clusterAdmissionPolicy: true,
    app:                    true,
    deployment:             true
  }
};

const kwVersions = {
  old: '1.6.0',
  new: '1.7.0'
};

describe('component: PolicyReporter', () => {
  const createWrapper = (overrides?: any) => {
    return mount(PolicyReporter, {
      data() {
        return { ...commonData };
      },
      global: {
        mocks: commonMocks,
        stubs: commonStubs
      },
      ...overrides,
    });
  };

  it('Should show unavailable banner when no permissions', () => {
    const wrapper = createWrapper({
      data() {
        return {
          ...commonData,
          isAdminUser: false,
          permissions: {
            policyServer:           false,
            admissionPolicy:        false,
            clusterAdmissionPolicy: false,
            app:                    false,
            deployment:             false
          },
        };
      }
    });

    const banner = wrapper.find('[data-testid="kw-unavailability-banner"]');

    expect(banner.exists()).toBe(true);
  });

  it('Should show Install Kubewarden button when uninstalled', () => {
    // Mock the 'cluster/schemaFor' getter to return false for all resources.
    const wrapper = createWrapper({
      global: {
        mocks: {
          ...commonMocks,
          $store: {
            getters: {
              ...commonMocks.$store.getters,
              'cluster/schemaFor': jest.fn(() => false)
            }
          }
        },
        stubs: commonStubs
      }
    });

    const banner = wrapper.find('[data-testid="kw-pr-noschema-banner"]');

    expect(banner.exists()).toBe(true);
  });

  it('Should show incompatible banner with old version', () => {
    const mockCloneWithOldVersion = { ...mockControllerDeployment };

    mockCloneWithOldVersion.metadata!.labels!['app.kubernetes.io/version'] = kwVersions.old;

    const wrapper = createWrapper({
      data() {
        return {
          ...commonData,
          controller: mockControllerDeployment
        };
      }
    });

    const banner = wrapper.find('[data-testid="kw-pr-incompatibile-banner"]');
    const badge = wrapper.find('[data-testid="kw-pr-controller-version-badge"]');

    expect(banner.exists()).toBe(true);
    expect(badge.exists()).toBe(true);
    expect(badge.html()).toContain(kwVersions.old as string);
  });

  it('Should show CRDs warning banner when not installed', () => {
    const mockCloneWithOldVersion = { ...mockControllerDeployment };

    mockCloneWithOldVersion.metadata!.labels!['app.kubernetes.io/version'] = kwVersions.new;

    // Mock the 'cluster/schemaFor' getter to return false for WG_POLICY_K8S resources.
    const wrapper = createWrapper({
      data() {
        return {
          ...commonData,
          controller: mockControllerDeployment
        };
      },
      global: {
        mocks: {
          ...commonMocks,
          $store: {
            getters: {
              ...commonMocks.$store.getters,
              'cluster/schemaFor': jest.fn((resourceType) => {
                if (resourceType === WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE || resourceType === WG_POLICY_K8S.POLICY_REPORT.TYPE) {
                  return false;
                }

                return true;
              })
            }
          }
        },
        stubs: commonStubs
      }
    });

    const banner = wrapper.find('[data-testid="kw-pr-no-crds-banner"]');

    expect(banner.exists()).toBe(true);
  });

  it('Should show Policy Reporter iframe when available', () => {
    const url = 'https://my-rancher.com/api/v1/namespaces/cattle-kubewarden-system/services/http:rancher-kubewarden-controller-ui:8080/proxy/';

    const wrapper = createWrapper({
      data() {
        return {
          ...commonData,
          controller:               mockControllerDeployment,
          reporterReportingService: true,
          reporterUIService:        true,
          reporterUrl:              url
        };
      },
    });

    const link = wrapper.find('[data-testid="kw-pr-reporter-link"]');
    const iframe = wrapper.find('[data-testid="kw-pr-iframe"]');

    expect(link.exists()).toBe(true);
    expect(link.attributes().href).toStrictEqual(url as string);

    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes().src).toStrictEqual(url as string);
  });
});
