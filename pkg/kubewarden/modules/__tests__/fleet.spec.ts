import { FLEET } from '@shell/config/labels-annotations';

import {
  isFleetDeployment,
  findFleetContent,
  getPolicyServerModule
} from '@kubewarden/modules/fleet';


describe('isFleetDeployment', () => {
  it('should return false if app is null', () => {
    expect(isFleetDeployment(null)).toBe(false);
  });

  it('should return false if the app does not have the fleet bundle annotation', () => {
    const appWithoutAnnotation = { spec: { chart: { metadata: { annotations: {} } } } };

    expect(isFleetDeployment(appWithoutAnnotation)).toBe(false);
  });

  it('should return true if the app contains the fleet bundle annotation', () => {
    const appWithAnnotation = { spec: { chart: { metadata: { annotations: { [FLEET.BUNDLE_ID]: 'bundle-123' } } } } };

    expect(isFleetDeployment(appWithAnnotation)).toBe(true);
  });
});

describe('findFleetContent', () => {
  it('should return null if fleetBundles array is empty', () => {
    expect(findFleetContent('PolicyServer', [])).toBeNull();
  });

  it('should return null if no resource content includes the specified context', () => {
    const bundles = [
      {
        spec: {
          helm:      { chart: 'chart1' },
          resources: [{
            name:    'file.txt',
            content: 'some content'
          }]
        }
      },
      {
        spec: {
          helm:      { chart: 'chart2' },
          resources: [{
            name:    'file.yaml',
            content: 'other content'
          }]
        }
      }
    ];

    expect(findFleetContent('PolicyServer', bundles)).toBeNull();
  });

  it('should skip bundles with a chart matching skipChart', () => {
    const bundles = [
      {
        spec: {
          helm:      { chart: 'skip-this' },
          resources: [{
            name:    'file.yaml',
            content: 'kind: PolicyServer'
          }]
        }
      },
      {
        spec: {
          helm:      { chart: 'valid-chart' },
          resources: [{
            name:    'file.yaml',
            content: 'kind: PolicyServer'
          }]
        }
      }
    ];
    const result = findFleetContent('PolicyServer', bundles, 'skip-this');

    // It should skip the first bundle and return the second.
    expect(result).toEqual(bundles[1]);
  });

  it('should return the first matching bundle that contains a resource with the context', () => {
    const bundle1 = {
      spec: {
        helm:      { chart: 'chart1' },
        resources: [{
          name:    'file.yaml',
          content: 'kind: SomethingElse'
        }]
      }
    };
    const bundle2 = {
      spec: {
        helm:      { chart: 'chart2' },
        resources: [{
          name:    'file.yaml',
          content: 'kind: PolicyServer'
        }]
      }
    };
    const bundles = [bundle1, bundle2];

    expect(findFleetContent('PolicyServer', bundles)).toEqual(bundle2);
  });
});

describe('getPolicyServerModule', () => {
  it('should return null if findFleetContent returns null', () => {
    // Pass an empty array so findFleetContent returns null.
    expect(getPolicyServerModule([])).toBeNull();
  });

  it('should return null if no values.yaml resource is found in the matching bundle', () => {
    const bundle = {
      spec: {
        helm:      { chart: 'valid-chart' },
        resources: [
          {
            name:    'mock.yaml',
            content: 'kind: PolicyServer'
          }
        ]
      }
    };

    expect(getPolicyServerModule([bundle])).toBeNull();
  });

  it('should return null if YAML parsing fails', () => {
    const bundle = {
      spec: {
        helm:      { chart: 'valid-chart' },
        resources: [
          {
            name:    'values.yaml',
            content: 'invalid: : yaml: :'
          }
        ]
      }
    };

    // getPolicyServerModule should catch the YAML parse error and return null.
    expect(getPolicyServerModule([bundle])).toBeNull();
  });

  it('should return the module string if valid YAML content is provided', () => {
    const validYaml = `
global:
  cattle:
    systemDefaultRegistry: "docker.io"
policyServer:
  image:
    repository: "policy-server"
    tag: "1.0.0"
`;
    // Create a bundle that will be matched by findFleetContent.
    const bundle = {
      spec: {
        helm:      { chart: 'valid-chart' },
        resources: [
          {
            name:    'mock.yaml',
            content: 'kind: PolicyServer'
          },
          {
            name:    'values.yaml',
            content: validYaml
          }
        ]
      }
    };
    const result = getPolicyServerModule([bundle]);

    expect(result).toBe('docker.io/policy-server:1.0.0');
  });
});
