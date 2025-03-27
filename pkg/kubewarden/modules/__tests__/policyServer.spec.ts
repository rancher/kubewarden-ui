import {
  isPolicyServerResource,
  findPolicyServerResource,
  findServiceMonitor,
  Labels,
} from '@kubewarden/modules/policyServer';

describe('isPolicyServerResource', () => {
  it('should return false if labels is undefined', () => {
    expect(isPolicyServerResource(undefined, 'default')).toBe(false);
  });

  it('should return true for legacy label match', () => {
    const labels: Labels = { app: 'kubewarden-policy-server-default' };

    expect(isPolicyServerResource(labels, 'default')).toBe(true);
  });

  it('should return true for new strict labels match', () => {
    const labels: Labels = {
      'app.kubernetes.io/instance':   'policy-server-default',
      'app.kubernetes.io/component':  'policy-server',
      'app.kubernetes.io/part-of':    'kubewarden'
    };

    expect(isPolicyServerResource(labels, 'default')).toBe(true);
  });

  it('should return false when labels do not match any supported format', () => {
    const labels: Labels = { app: 'some-other-app' };

    expect(isPolicyServerResource(labels, 'default')).toBe(false);
  });

  it('should return false when only a partial new format is provided', () => {
    const labels: Labels = {
      'app.kubernetes.io/instance': 'policy-server-default',
      // Missing the other required new-format keys.
    };

    expect(isPolicyServerResource(labels, 'default')).toBe(false);
  });
});

describe('findPolicyServerResource', () => {
  // Create a sample array of resources with metadata.labels
  const resources = [
    // Matches legacy format for "default"
    { metadata: { labels: { app: 'kubewarden-policy-server-default' } } },
    // Matches new strict format for "other"
    {
      metadata: {
        labels: {
          'app.kubernetes.io/instance':   'policy-server-other',
          'app.kubernetes.io/component':  'policy-server',
          'app.kubernetes.io/part-of':    'kubewarden'
        },
      },
    },
    // Non-matching resource
    { metadata: { labels: { app: 'not-matching' } } },
  ];

  it('should return the resource matching the legacy label', () => {
    const result = findPolicyServerResource(resources, 'default');

    expect(result).toBe(resources[0]);
  });

  it('should return the resource matching the new strict labels', () => {
    const result = findPolicyServerResource(resources, 'other');

    expect(result).toBe(resources[1]);
  });

  it('should return undefined if no resource matches', () => {
    const result = findPolicyServerResource(resources, 'nonexistent');

    expect(result).toBeUndefined();
  });

  it('should allow a custom label accessor', () => {
    const customResources = [
      { labels: { app: 'kubewarden-policy-server-custom' } },
    ];
    const customAccessor = (resource: any) => resource.labels;
    const result = findPolicyServerResource(customResources, 'custom', customAccessor);

    expect(result).toBe(customResources[0]);
  });
});

describe('findServiceMonitor', () => {
  const mockLegacySM = { spec: { selector: { matchLabels: { app: 'kubewarden-policy-server-default' } } } };

  const mockNewSM = {
    spec: {
      selector: {
        matchLabels: {
          'app.kubernetes.io/instance':   'policy-server-default',
          'app.kubernetes.io/component':  'policy-server',
          'app.kubernetes.io/part-of':    'kubewarden'
        },
      },
    },
  };

  it('should return undefined when allServiceMonitors is empty', () => {
    const config = {
      policyObj:          { spec: { policyServer: 'default' } },
      policyServerObj:    undefined,
      allServiceMonitors: [],
    };
    const result = findServiceMonitor(config);

    expect(result).toBeUndefined();
  });

  it('should return undefined if no policy server name is provided', () => {
    const config = {
      policyObj:          { spec: {} },
      policyServerObj:    {},
      allServiceMonitors: [mockLegacySM],
    };
    const result = findServiceMonitor(config);

    expect(result).toBeUndefined();
  });

  it('should return a matching ServiceMonitor using legacy labels', () => {
    const config = {
      policyObj:          { spec: { policyServer: 'default' } },
      policyServerObj:    undefined,
      allServiceMonitors: [mockLegacySM, mockNewSM],
    };
    const result = findServiceMonitor(config);

    expect(result).toBe(mockLegacySM);
  });

  it('should return a matching ServiceMonitor using new strict labels', () => {
    // Use policyServerObj when policyObj is not provided.
    const config = {
      policyObj:          undefined,
      policyServerObj:    { id: 'default' },
      allServiceMonitors: [mockNewSM, mockLegacySM],
    };
    const result = findServiceMonitor(config);

    expect(result).toBe(mockNewSM);
  });

  it('should return the first matching ServiceMonitor if multiple matches exist', () => {
    // In this scenario, both monitors match; the first in the array should be returned.
    const config = {
      policyObj:          { spec: { policyServer: 'default' } },
      policyServerObj:    undefined,
      allServiceMonitors: [mockNewSM, mockLegacySM],
    };
    const result = findServiceMonitor(config);

    expect(result).toBe(mockNewSM);
  });
});
