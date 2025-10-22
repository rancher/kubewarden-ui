import Image from '../sbomscanner.kubewarden.io.image';

// Minimal mock SteveModel superclass
class MockSteveModel {
  [key: string]: any;

  get _availableActions(): Array<{ action?: string }> {
    return [
      { action: 'download' },
      { action: 'downloadYaml' },
      { action: 'viewYaml' },
      { action: 'editYaml' },
      { action: 'clone' },
    ];
  }
}

describe('Image model', () => {
  const origProto = Object.getPrototypeOf((Image as any).prototype);

  beforeAll(() => {
    Object.setPrototypeOf((Image as any).prototype, MockSteveModel.prototype);
  });

  afterAll(() => {
    Object.setPrototypeOf((Image as any).prototype, origProto);
  });

  test('_availableActions filters download/view actions', () => {
    const inst = Object.create((Image as any).prototype);
    const actions = inst._availableActions;

    expect(Array.isArray(actions)).toBe(true);
    expect(actions.find((a: any) => a.action === 'download')).toBeUndefined();
    expect(actions.find((a: any) => a.action === 'editYaml')).toBeDefined();
  });

  test('vulnerabilityReport returns null when metadata absent or store empty', () => {
    const inst = Object.create((Image as any).prototype);
    inst.metadata = undefined;
    expect(inst.vulnerabilityReport).toBeNull();

    inst.metadata = { name: 'img-1' };
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [] } };
    expect(inst.vulnerabilityReport).toBeNull();
  });

  test('vulnerabilityReport finds matching report by metadata.name and handles errors', () => {
    const inst = Object.create((Image as any).prototype);
    inst.metadata = { name: 'img-1' };

    const reports = [ { metadata: { name: 'other' } }, { metadata: { name: 'img-1' }, spec: { report: '{}' } } ];
    inst.$store = { getters: { 'cluster/all': (_arg: string) => reports } };

    const found = inst.vulnerabilityReport;
    expect(found).toBeDefined();
    expect(found.metadata.name).toBe('img-1');

    // If getter throws, returns null
    inst.$store = { getters: { 'cluster/all': () => { throw new Error('boom'); } } };
    expect(inst.vulnerabilityReport).toBeNull();
  });

  test('sbom returns null when metadata absent or store empty and finds matching sbom', () => {
    const inst = Object.create((Image as any).prototype);
    inst.metadata = undefined;
    expect(inst.sbom).toBeNull();

    inst.metadata = { name: 'img-2' };
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [] } };
    expect(inst.sbom).toBeNull();

    const sboms = [ { metadata: { name: 'img-2' } } ];
    inst.$store = { getters: { 'cluster/all': (_arg: string) => sboms } };
    expect(inst.sbom).toBeDefined();
    expect(inst.sbom.metadata.name).toBe('img-2');

    // error path
    inst.$store = { getters: { 'cluster/all': () => { throw new Error('nope'); } } };
    expect(inst.sbom).toBeNull();
  });

  test('vulnerabilityDetails parses report string/object and handles errors', () => {
    const inst = Object.create((Image as any).prototype);

    // no report: metadata missing -> vulnerabilityReport will be null
    inst.metadata = undefined;
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [] } };
    expect(inst.vulnerabilityDetails).toEqual([]);

    // report as string: create a report in store that matches metadata.name
    const rep = { vulnerabilities: [ { cve: 'CVE-1' } ] };
    inst.metadata = { name: 'img-1' };
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-1' }, spec: { report: JSON.stringify(rep) } } ] } };
    expect(inst.vulnerabilityDetails.length).toBe(1);

    // report as object
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-1' }, spec: { report: rep } } ] } };
    expect(inst.vulnerabilityDetails.length).toBe(1);

    // invalid JSON
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-1' }, spec: { report: '{ bad json' } } ] } };
    expect(inst.vulnerabilityDetails).toEqual([]);
  });

  test('severityDistribution, totalVulnerabilities and overallSeverity calculations', () => {
    const inst = Object.create((Image as any).prototype);

    // no report: metadata missing or store empty
    inst.metadata = undefined;
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [] } };
    expect(inst.severityDistribution).toEqual({ critical: 0, high: 0, medium: 0, low: 0, none: 0 });
    expect(inst.totalVulnerabilities).toBe(0);
    expect(inst.overallSeverity).toBe('none');

    // with summary: put a matching report in the store as JSON string
    const reportData = { summary: { severityDistribution: { critical: 2, high: 1, medium: 0, low: 0, none: 0 } } };
    inst.metadata = { name: 'img-1' };
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-1' }, spec: { report: JSON.stringify(reportData) } } ] } };

    let dist = inst.severityDistribution;
    expect(dist.critical).toBe(2);
    expect(inst.totalVulnerabilities).toBe(3);
    expect(inst.overallSeverity).toBe('critical');

    // also exercise when report is already an object
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-1' }, spec: { report: reportData } } ] } };
    dist = inst.severityDistribution;
    expect(dist.critical).toBe(2);
  });

  test('listLocation / doneOverride / parentLocationOverride values', () => {
    const inst = Object.create((Image as any).prototype);

    expect(inst.listLocation).toHaveProperty('name');
    expect(inst.doneOverride).toEqual(inst.listLocation);
    expect(inst.parentLocationOverride).toEqual(inst.listLocation);
  });

  test('_availableActions preserves null/empty and removes download variants', () => {
    const mockProto = Object.getPrototypeOf((Image as any).prototype);
    const origDesc = Object.getOwnPropertyDescriptor(mockProto, '_availableActions');

    // superclass returns undefined
    Object.defineProperty(mockProto, '_availableActions', {
      get() { return undefined; },
      configurable: true
    });

    const inst1 = Object.create((Image as any).prototype);
    expect(inst1._availableActions).toEqual([]);

    // mix of null/undefined/empty/downloadyaml
    Object.defineProperty(mockProto, '_availableActions', {
      get() { return [null, undefined, { action: '' }, { action: 'downloadyaml' }, { action: 'keep' }]; },
      configurable: true
    });

    const inst2 = Object.create((Image as any).prototype);
    const actions = inst2._availableActions;
    expect(actions.find((a: any) => a === null || a === undefined)).toBeDefined();
    expect(actions.find((a: any) => a && a.action === '')).toBeDefined();
    expect(actions.find((a: any) => a && a.action === 'downloadyaml')).toBeUndefined();
    expect(actions.find((a: any) => a && a.action === 'keep')).toBeDefined();

    // restore
    if (origDesc) {
      Object.defineProperty(mockProto, '_availableActions', origDesc);
    } else {
      delete (mockProto as any)._availableActions;
    }
  });

  test('vulnerabilityDetails returns [] when vulnerabilities missing in report', () => {
    const inst = Object.create((Image as any).prototype);
    inst.metadata = { name: 'img-missing' };
    // report has no vulnerabilities key
    const reportData = { some: 'data' };
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-missing' }, spec: { report: JSON.stringify(reportData) } } ] } };

    expect(inst.vulnerabilityDetails).toEqual([]);
  });

  test('severityDistribution handles invalid JSON and missing summary', () => {
    const inst = Object.create((Image as any).prototype);

    inst.metadata = { name: 'img-err' };
    // invalid JSON should return default distribution
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-err' }, spec: { report: '{ bad json' } } ] } };
    expect(inst.severityDistribution).toEqual({ critical: 0, high: 0, medium: 0, low: 0, none: 0 });

    // parsed JSON but missing summary should return default
    inst.$store = { getters: { 'cluster/all': (_arg: string) => [ { metadata: { name: 'img-err' }, spec: { report: JSON.stringify({}) } } ] } };
    expect(inst.severityDistribution).toEqual({ critical: 0, high: 0, medium: 0, low: 0, none: 0 });
  });

  test('vulnerabilityReport returns undefined when reports contain items without metadata or no match', () => {
    const inst = Object.create((Image as any).prototype);
    inst.metadata = { name: 'img-no-match' };

    // reports include an item without metadata and one with non-matching metadata
    const reports = [ { foo: 'bar' }, { metadata: { name: 'other' } } ];
    inst.$store = { getters: { 'cluster/all': (_arg: string) => reports } };

    const found = inst.vulnerabilityReport;
    expect(found).toBeUndefined();
  });

  test('sbom returns undefined when sboms contain items without metadata or no match', () => {
    const inst = Object.create((Image as any).prototype);
    inst.metadata = { name: 'img-nomatch' };

    const sboms = [ { no: 'meta' }, { metadata: { name: 'other' } } ];
    inst.$store = { getters: { 'cluster/all': (_arg: string) => sboms } };

    expect(inst.sbom).toBeUndefined();
  });
});
