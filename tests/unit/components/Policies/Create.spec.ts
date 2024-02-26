import { describe, expect, it } from '@jest/globals';
import jsyaml from 'js-yaml';

import { KUBEWARDEN } from '@kubewarden/types';
import { createWrapper } from '@tests/unit/_utils_/wrapper';

import Create from '@kubewarden/components/Policies/Create.vue';

import policyPackages from '@tests/unit/_templates_/policyPackages';

function mockParsePackageMetadata(data) {
  if (data) {
    const parsed = JSON.parse(JSON.stringify(data));

    return jsyaml.load(parsed);
  }

  return null;
}

const commons = {
  propsData: { value: { parsePackageMetadata: mockParsePackageMetadata } },
  computed:  {
    isAirgap:              () => false,
    isCreate:              () => true,
    canFinish:             () => true,
    hasArtifactHub:        () => true,
    hasRequired:           () => true,
    hideArtifactHubBanner: () => true,
    hideAirgapBanner:      () => true,
  },
  provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
  mocks:   {
    $fetchState: { pending: false },
    $store:      {
      getters: {
        'i18n/t':                            jest.fn(),
        'kubewarden/airGapped':              jest.fn(),
        'kubewarden/hideBannerArtifactHub':  jest.fn(),
        'kubewarden/hideBannerAirgapPolicy': jest.fn(),
        'cluster/all':                       jest.fn(),
      },
    },
  },
};

const wrapperFactory = createWrapper(Create, commons);

describe('component: PoliciesCreate', () => {
  const duplicatePolicy1 = policyPackages[7];
  const duplicatePolicy2 = policyPackages[8];

  const WizardMock = {
    render(h) {
      return h('div');
    },
    methods: { next: jest.fn() },
  };

  it('parses correct artifacthub package details depending on the repository package selected', async() => {
    const wrapper = wrapperFactory({
      stubs: {
        Banner:      { template: '<span />' },
        Markdown:    { template: '<span />' },
        AsyncButton: { template: '<span />' },
        Wizard:      WizardMock,
      },
    });

    await wrapper.vm.$nextTick();
    wrapper.setData({ packages: policyPackages });

    wrapper.vm.selectType(duplicatePolicy1);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.chartValues.policy.spec.module).toStrictEqual(
      duplicatePolicy1.containers_images[0].image
    );
    expect(wrapper.vm.packageValues.readme).toStrictEqual(
      duplicatePolicy1.readme
    );

    wrapper.vm.reset({ step: { name: 'policies' } });
    await wrapper.vm.$nextTick();

    wrapper.vm.selectType(duplicatePolicy2);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.chartValues.policy.spec.module).toStrictEqual(
      duplicatePolicy2.containers_images[0].image
    );
    expect(wrapper.vm.packageValues.readme).toStrictEqual(
      duplicatePolicy2.readme
    );
  });
});
