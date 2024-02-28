import { describe, expect, it } from '@jest/globals';
import jsyaml from 'js-yaml';

import { DATA_ANNOTATIONS } from '@kubewarden/types';

import Config from '@kubewarden/components/Policies/Config';

import { createWrapper } from '@tests/unit/_utils_/wrapper';
import { policyPackages, exampleData } from '@tests/unit/_templates_/policyPackages';
import { containerResourcesPolicy } from '@tests/unit/_templates_/policyConfig';

jest.mock('@shell/utils/create-yaml', () => ({ saferDump: jest.fn().mockReturnValue('') }));

function mockArtifactHubPackageVersion() {
  return policyPackages.find(pkg => pkg.name === 'container-resources');
}

function mockParsePackageMetadata(data) {
  if (data) {
    const parsed = JSON.parse(JSON.stringify(data));

    return jsyaml.load(parsed);
  }

  return null;
}

const commons = {
  propsData: {
    value: {
      ...containerResourcesPolicy,
      artifactHubPackageVersion: mockArtifactHubPackageVersion,
      parsePackageMetadata:      mockParsePackageMetadata
    }
  },
  mocks: { $fetchState: { pending: false } },
  stubs: { Values: { template: '<span />' } }
};

const wrapperFactory = createWrapper(Config, commons);

describe('component: PolicyConfig', () => {
  it('fetches data and updates chartValues correctly when ARTIFACTHUB_PKG_ANNOTATION is present', async() => {
    const parsedQuestions = mockParsePackageMetadata(exampleData[DATA_ANNOTATIONS.QUESTIONS]);
    const wrapper = wrapperFactory();

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.chartValues.questions).toStrictEqual(parsedQuestions);
  });

  it('does not overwrite existing chartValues.policy.spec.settings', async() => {
    const testSettings = { test: 42 };
    const wrapper = wrapperFactory({
      propsData: {
        value: {
          ...containerResourcesPolicy,
          spec:                      { settings: testSettings },
          artifactHubPackageVersion: mockArtifactHubPackageVersion,
          parsePackageMetadata:      mockParsePackageMetadata
        }
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.chartValues.policy.spec.settings).toEqual(testSettings);
  });
});
