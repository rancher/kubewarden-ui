import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';
import semver from 'semver';

import PolicyReporter from '@kubewarden/components/PolicyReporter/index.vue';

const defaultMocks = {
  $fetchState: { pending: false },
  $store:      {
    getters: {
      'cluster/schemaFor': jest.fn(),
      'i18n/t':            jest.fn(),
    }
  }
};

const defaultComputed = {
  hasPolicyServerSchema:        () => null,
  hasClusterPolicyReportSchema: () => null,
  hasPolicyReportSchema:        () => null,
  reporterCrds:                 () => null,
  controllerNamespace:          () => null,
  controllerVersion:            () => null,
  canShowReporter:              () => null
};

const mockCanShowReporter = (version: String): Boolean => {
  if ( !version ) {
    return false;
  }

  return semver.satisfies(version, '>=1.7.0 || >=1.7.0-rc*', { includePrerelease: true });
};

const kwVersions = {
  old: '1.6.0',
  new: '1.7.0'
};

describe('component: PolicyReporter', () => {
  it('Should show Install Kubewarden button when uninstalled', () => {
    const wrapper = shallowMount(PolicyReporter as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      mocks:    defaultMocks,
      computed: defaultComputed,
      stubs:    { 'n-link': { template: '<span />' } }
    });

    const banner = wrapper.find('[data-testid="kw-pr-noschema-banner"]');

    expect(banner.exists()).toBe(true);
  });

  it('Should show incompatible banner with old version', () => {
    const wrapper = shallowMount(PolicyReporter as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      mocks:    defaultMocks,
      computed: {
        ...defaultComputed,
        hasPolicyServerSchema: () => true,
        controllerVersion:     () => kwVersions.old,
        canShowReporter:       () => mockCanShowReporter(kwVersions.old)
      },
    });

    const banner = wrapper.find('[data-testid="kw-pr-incompatibile-banner"]');
    const badge = wrapper.find('[data-testid="kw-pr-controller-version-badge"]');

    expect(banner.exists()).toBe(true);
    expect(badge.exists()).toBe(true);
    expect(badge.html()).toContain(kwVersions.old as String);
  });

  it('Should show CRDs warning banner when not installed', () => {
    const wrapper = shallowMount(PolicyReporter as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      mocks:    defaultMocks,
      computed: {
        ...defaultComputed,
        hasPolicyServerSchema: () => true,
        controllerVersion:     () => kwVersions.new,
        canShowReporter:       () => mockCanShowReporter(kwVersions.new)
      },
    });

    const banner = wrapper.find('[data-testid="kw-pr-no-crds-banner"]');

    expect(banner.exists()).toBe(true);
  });

  it('Should show warning banner when main service is unavailable', () => {
    const wrapper = shallowMount(PolicyReporter as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      mocks:    defaultMocks,
      computed: {
        ...defaultComputed,
        hasPolicyServerSchema: () => true,
        controllerVersion:     () => kwVersions.new,
        canShowReporter:       () => mockCanShowReporter(kwVersions.new),
        reporterCrds:          () => true
      },
    });

    const banner = wrapper.find('[data-testid="kw-pr-main-service-unavailable-banner"]');

    expect(banner.exists()).toBe(true);
  });

  it('Should show warning banner when UI service is unavailable', () => {
    const wrapper = shallowMount(PolicyReporter as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      data() {
        return { reporterReportingService: true };
      },
      mocks:    defaultMocks,
      computed: {
        ...defaultComputed,
        hasPolicyServerSchema: () => true,
        controllerVersion:     () => kwVersions.new,
        canShowReporter:       () => mockCanShowReporter(kwVersions.new),
        reporterCrds:          () => true
      },
    });

    const banner = wrapper.find('[data-testid="kw-pr-ui-service-unavailable-banner"]');

    expect(banner.exists()).toBe(true);
  });

  it('Should show Policy Reporter iframe when available', () => {
    const url = 'https://my-rancher.com/api/v1/namespaces/cattle-kubewarden-system/services/http:rancher-kubewarden-controller-ui:8080/proxy/';

    const wrapper = shallowMount(PolicyReporter as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      data() {
        return {
          reporterReportingService: true,
          reporterUIService:        true,
          reporterUrl:              url
        };
      },
      mocks:    defaultMocks,
      computed: {
        ...defaultComputed,
        hasPolicyServerSchema: () => true,
        controllerVersion:     () => kwVersions.new,
        canShowReporter:       () => mockCanShowReporter(kwVersions.new),
        reporterCrds:          () => true
      },
    });

    const link = wrapper.find('[data-testid="kw-pr-reporter-link"]');
    const iframe = wrapper.find('[data-testid="kw-pr-iframe"]');

    expect(link.exists()).toBe(true);
    expect(link.attributes().href).toStrictEqual(url as String);

    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes().src).toStrictEqual(url as String);
  });
});