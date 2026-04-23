import {
  applyCreatePolicyDefaults,
  resolveQuestionDefault,
  shouldApplyQuestionDefault
} from '@kubewarden/modules/policyDefaults';

describe('modules: policyDefaults', () => {
  it('preserves existing mode and policyServer values for create flow', () => {
    const policy = {
      spec: {
        mode:         'monitor',
        policyServer: ''
      }
    };

    const policyServers = [
      {
        id:       'non-default',
        metadata: { annotations: { 'meta.helm.sh/release-name': 'something-else' } }
      },
      {
        id:       'default',
        metadata: { annotations: { 'meta.helm.sh/release-name': 'rancher-kubewarden-defaults' } }
      }
    ];

    applyCreatePolicyDefaults(policy, policyServers);

    expect(policy.spec.mode).toBe('monitor');
    expect(policy.spec.policyServer).toBe('');
  });

  it('applies defaults only when mode and policyServer are undefined', () => {
    const policy = { spec: {} };

    const policyServers = [
      {
        id:       'default',
        metadata: { annotations: { 'meta.helm.sh/release-name': 'rancher-kubewarden-defaults' } }
      }
    ];

    applyCreatePolicyDefaults(policy, policyServers);

    expect(policy.spec.mode).toBe('protect');
    expect(policy.spec.policyServer).toBe('default');
  });

  it('coerces boolean question default strings', () => {
    expect(resolveQuestionDefault({
      type:    'boolean',
      default: 'true'
    })).toBe(true);
    expect(resolveQuestionDefault({
      type:    'boolean',
      default: 'false'
    })).toBe(false);
  });

  it('only applies question default when value is undefined and default is meaningful', () => {
    expect(shouldApplyQuestionDefault(undefined, 'protect')).toBe(true);
    expect(shouldApplyQuestionDefault(undefined, '')).toBe(false);
    expect(shouldApplyQuestionDefault(undefined, null)).toBe(false);
    expect(shouldApplyQuestionDefault(undefined, {})).toBe(false);
    expect(shouldApplyQuestionDefault('', 'fallback')).toBe(false);
    expect(shouldApplyQuestionDefault(null, 'fallback')).toBe(false);
  });
});
