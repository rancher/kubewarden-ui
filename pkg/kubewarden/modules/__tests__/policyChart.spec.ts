import { buildModuleString, parseModuleString, parsePolicyModule } from '@kubewarden/modules/policyChart';

describe('parsePolicyModule', () => {
  it('should use global.cattle.systemDefaultRegistry as registry and treat module.repository as a pure path', () => {
    const versionInfo = {
      values: {
        global:  { cattle: { systemDefaultRegistry: 'ghcr.io' } },
        module: {
          repository: 'kubewarden/policies/psa-label-enforcer',
          tag:        'v1.0.11'
        }
      }
    } as any;

    expect(parsePolicyModule(versionInfo)).toStrictEqual({
      registry:   'ghcr.io',
      repository: 'kubewarden/policies/psa-label-enforcer',
      tag:        'v1.0.11',
      source:     'values'
    });
  });

  it('should return empty registry when global.cattle.systemDefaultRegistry is not set', () => {
    const versionInfo = {
      values: {
        module: {
          repository: 'kubewarden/policies/psa-label-enforcer',
          tag:        'v1.0.11'
        }
      }
    } as any;

    expect(parsePolicyModule(versionInfo)).toStrictEqual({
      registry:   '',
      repository: 'kubewarden/policies/psa-label-enforcer',
      tag:        'v1.0.11',
      source:     'values'
    });
  });

  it('should fall back to legacy annotations when values.module is absent', () => {
    const versionInfo = {
      values: {},
      chart:  {
        annotations: {
          'kubewarden/registry':   'ghcr.io',
          'kubewarden/repository': 'kubewarden/policies/psa-label-enforcer',
          'kubewarden/tag':        'v1.0.11'
        }
      }
    } as any;

    expect(parsePolicyModule(versionInfo)).toStrictEqual({
      registry:   'ghcr.io',
      repository: 'kubewarden/policies/psa-label-enforcer',
      tag:        'v1.0.11',
      source:     'annotations'
    });
  });
});

describe('policyChart module helpers', () => {
  it('should parse modules without a registry', () => {
    expect(parseModuleString('kubewarden/pod-privileged:v1.2.3')).toStrictEqual({
      registry:   '',
      repository: 'kubewarden/pod-privileged',
      tag:        'v1.2.3'
    });
  });

  it('should parse deep-path modules without a registry', () => {
    expect(parseModuleString('kubewarden/policies/psa-label-enforcer:v1.0.11')).toStrictEqual({
      registry:   '',
      repository: 'kubewarden/policies/psa-label-enforcer',
      tag:        'v1.0.11'
    });
  });

  it('should parse deep-path modules with a standard registry host', () => {
    expect(parseModuleString('ghcr.io/kubewarden/policies/psa-label-enforcer:v1.0.11')).toStrictEqual({
      registry:   'ghcr.io',
      repository: 'kubewarden/policies/psa-label-enforcer',
      tag:        'v1.0.11'
    });
  });

  it('should parse modules with a standard registry host', () => {
    expect(parseModuleString('ghcr.io/kubewarden/pod-privileged:v1.2.3')).toStrictEqual({
      registry:   'ghcr.io',
      repository: 'kubewarden/pod-privileged',
      tag:        'v1.2.3'
    });
  });

  it('should parse modules with a registry that includes a port', () => {
    expect(parseModuleString('registry.internal:5000/kubewarden/pod-privileged:v1.2.3')).toStrictEqual({
      registry:   'registry.internal:5000',
      repository: 'kubewarden/pod-privileged',
      tag:        'v1.2.3'
    });
  });

  it('should assemble modules with and without registries', () => {
    expect(buildModuleString('', 'kubewarden/pod-privileged', 'v1.2.3')).toBe('kubewarden/pod-privileged:v1.2.3');
    expect(buildModuleString('ghcr.io', 'kubewarden/pod-privileged', 'v1.2.3')).toBe('ghcr.io/kubewarden/pod-privileged:v1.2.3');
  });
});
