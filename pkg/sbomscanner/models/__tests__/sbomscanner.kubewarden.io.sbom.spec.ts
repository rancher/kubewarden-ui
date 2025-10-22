import SBOM from '../sbomscanner.kubewarden.io.sbom';

// Mock SteveModel prototype similar to previous tests
class MockSteveModel {
  [key: string]: any;
  get _availableActions() {
    return [ { action: 'download' }, { action: 'editYaml' }, { action: 'clone' }, { action: 'downloadyaml' } ];
  }
}

describe('SBOM model', () => {
  const origProto = Object.getPrototypeOf((SBOM as any).prototype);

  beforeAll(() => {
    Object.setPrototypeOf((SBOM as any).prototype, MockSteveModel.prototype);
  });

  afterAll(() => {
    Object.setPrototypeOf((SBOM as any).prototype, origProto);
  });

  test('_availableActions filters download actions', () => {
    const inst = Object.create((SBOM as any).prototype);
    const actions = inst._availableActions;

    expect(actions.find((a: any) => a.action === 'download')).toBeUndefined();
    expect(actions.find((a: any) => a.action === 'downloadyaml')).toBeUndefined();
    expect(actions.find((a: any) => a.action === 'editYaml')).toBeDefined();
  });

  test('listLocation/doneOverride/parentLocationOverride', () => {
    const inst = Object.create((SBOM as any).prototype);
    expect(inst.listLocation).toHaveProperty('name');
    expect(inst.doneOverride).toEqual(inst.listLocation);
    expect(inst.parentLocationOverride).toEqual(inst.listLocation);
  });

  test('spdxData parses string and object, and handles invalid JSON', () => {
    const inst = Object.create((SBOM as any).prototype);
    const obj = { packages: [{ name: 'p1' }], documentDescribes: ['doc1'], creationInfo: { licenseListVersion: '1.0' } };

    // object
    inst.spec = { spdx: obj };
    expect(inst.spdxData).toBe(obj);
    expect(inst.packages.length).toBe(1);
    expect(inst.documentInfo.length).toBe(1);
    expect(inst.creationInfo).toEqual(obj.creationInfo);

    // string
    inst.spec = { spdx: JSON.stringify(obj) };
    expect(inst.spdxData).toEqual(obj);

    // invalid
    inst.spec = { spdx: '{ bad json }' };
    expect(inst.spdxData).toBeNull();
  });

  test('packages, documentInfo, creationInfo fallbacks and packageCount', () => {
    const inst = Object.create((SBOM as any).prototype);
    inst.spec = { spdx: {} };
    expect(inst.packages).toEqual([]);
    expect(inst.documentInfo).toEqual([]);
    expect(inst.creationInfo).toEqual({});
    expect(inst.packageCount).toBe(0);
  });

  test('licenseInfo fallback to Unknown when missing', () => {
    const inst = Object.create((SBOM as any).prototype);
    inst.spec = { spdx: { creationInfo: {} } };
    expect(inst.licenseInfo).toBe('Unknown');

    inst.spec = { spdx: { creationInfo: { licenseListVersion: '2.0' } } };
    expect(inst.licenseInfo).toBe('2.0');
  });

  test('associatedImage returns null when spec.image missing and finds via metadata or spec.name', () => {
    const inst = Object.create((SBOM as any).prototype);
    inst.spec = {};
    expect(inst.associatedImage).toBeNull();

    const inst2 = Object.create((SBOM as any).prototype);
    inst2.spec = { image: 'img-1' };
    inst2.$rootGetters = { 'i18n/t': (k: string) => k };
    const images = [ { metadata: { name: 'img-1' } }, { spec: { name: 'other' } } ];
    inst2.$getters = { all: (_arg: string) => images };
    expect(inst2.associatedImage.metadata.name).toBe('img-1');

    const inst3 = Object.create((SBOM as any).prototype);
    inst3.spec = { image: 'spec-img' };
    inst3.$rootGetters = { 'i18n/t': (k: string) => k };
    const images2 = [ { spec: { name: 'spec-img' } } ];
    inst3.$getters = { all: (_arg: string) => images2 };
    expect(inst3.associatedImage.spec.name).toBe('spec-img');
  });

  test('_availableActions handles undefined superclass actions and preserves null/empty entries while removing download variants', () => {
    const mockProto = Object.getPrototypeOf((SBOM as any).prototype);
    const origDesc = Object.getOwnPropertyDescriptor(mockProto, '_availableActions');

    // superclass returns undefined
    Object.defineProperty(mockProto, '_availableActions', {
      get() { return undefined; },
      configurable: true
    });

    const inst1 = Object.create((SBOM as any).prototype);
    expect(inst1._availableActions).toEqual([]);

    // superclass returns mixed entries including null/undefined and downloadyaml
    Object.defineProperty(mockProto, '_availableActions', {
      get() {
        return [null, undefined, { action: '' }, { action: 'downloadyaml' }, { action: 'keepMe' }];
      },
      configurable: true
    });

    const inst2 = Object.create((SBOM as any).prototype);
    const actions = inst2._availableActions;

    // null/undefined should be preserved
    expect(actions.find((a: any) => a === null || a === undefined)).toBeDefined();
    // empty action should be preserved
    expect(actions.find((a: any) => a && a.action === '')).toBeDefined();
    // downloadyaml should be removed
    expect(actions.find((a: any) => a && a.action === 'downloadyaml')).toBeUndefined();
    // keepMe should be present
    expect(actions.find((a: any) => a && a.action === 'keepMe')).toBeDefined();

    // restore
    if (origDesc) {
      Object.defineProperty(mockProto, '_availableActions', origDesc);
    } else {
      delete (mockProto as any)._availableActions;
    }
  });

  test('associatedImage returns undefined when images have no matching entry', () => {
    const inst = Object.create((SBOM as any).prototype);
    inst.spec = { image: 'not-found' };
    inst.$rootGetters = { 'i18n/t': (k: string) => k };
    inst.$getters = { all: (_arg: string) => [] };

    expect(inst.associatedImage).toBeUndefined();
  });

  test('spdxData and fallbacks when spec or spdx missing', () => {
    const inst = Object.create((SBOM as any).prototype);

    // spec not defined
    inst.spec = undefined as any;
    expect(inst.spdxData).toBeNull();
    expect(inst.packages).toEqual([]);
    expect(inst.documentInfo).toEqual([]);
    expect(inst.creationInfo).toEqual({});
    expect(inst.packageCount).toBe(0);
    expect(inst.licenseInfo).toBe('Unknown');

    // spec exists but spdx falsy
    inst.spec = {} as any;
    expect(inst.spdxData).toBeNull();
    expect(inst.packages).toEqual([]);
    expect(inst.documentInfo).toEqual([]);
    expect(inst.creationInfo).toEqual({});
    expect(inst.packageCount).toBe(0);
  });

  test('packageCount reflects packages length and licenseInfo reads creationInfo', () => {
    const inst = Object.create((SBOM as any).prototype);
    inst.spec = { spdx: { packages: [{}, {}, {}], creationInfo: { licenseListVersion: '3.1' } } };

    expect(inst.packages.length).toBe(3);
    expect(inst.packageCount).toBe(3);
    expect(inst.licenseInfo).toBe('3.1');
  });

  test('associatedImage matching covers metadata and spec name branches', () => {
    const inst = Object.create((SBOM as any).prototype);
    inst.spec = { image: 'meta-img' };
    inst.$rootGetters = { 'i18n/t': (k: string) => k };
    const images = [ { spec: { name: 'no' } }, { metadata: { name: 'meta-img' } } ];
    inst.$getters = { all: (_arg: string) => images };

    const found = inst.associatedImage;
    expect(found).toBeDefined();
    expect(found.metadata.name).toBe('meta-img');

    // spec-name match
    const inst2 = Object.create((SBOM as any).prototype);
    inst2.spec = { image: 'spec-img' };
    inst2.$rootGetters = { 'i18n/t': (k: string) => k };
    inst2.$getters = { all: (_arg: string) => [ { spec: { name: 'spec-img' } } ] };

    const found2 = inst2.associatedImage;
    expect(found2).toBeDefined();
    expect(found2.spec.name).toBe('spec-img');
  });

  test('associatedImage visits items with various shapes to exercise optional chaining branches', () => {
    const inst = Object.create((SBOM as any).prototype);
    inst.spec = { image: 'wanted' };
    inst.$rootGetters = { 'i18n/t': (k: string) => k };

    const images = [
      { metadata: { name: 'nope' } },
      { metadata: {} },
      { spec: {} },
      { spec: { name: 'wanted' } },
    ];

    inst.$getters = { all: (_arg: string) => images };

    const found = inst.associatedImage;
    expect(found).toBeDefined();
    expect(found.spec && found.spec.name).toBe('wanted');
  });
});
