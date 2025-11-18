import Registry from '../sbomscanner.kubewarden.io.registry';
import { RESOURCE } from '../../types';

// mock SteveModel base class
jest.mock('@shell/plugins/steve/steve-class', () => {
  return class {
    constructor() {
      this.t = jest.fn((s) => s);
      this.$dispatch = jest.fn();
      this.$rootGetters = { 'i18n/t': (s: any, vars: any) => (vars ? `${s} ${JSON.stringify(vars)}` : s) };
      this.$rootState = { targetRoute: {} };
      this.$getters = { all: jest.fn() };
      this.canEdit = true;
      this.metadata = { name: 'reg1', namespace: 'ns1' };
      this.id = 'ns1/reg1';
    }

    get _availableActions() {
      return [
        { action: 'showConfiguration' },
        { action: 'download' },
        { action: 'promptRemove' },
      ];
    }

    // stub parent listLocation
    get _listLocation() {
      return { name: 'base-location' };
    }
  };
});

describe('Registry model', () => {
  let registry: any;

  beforeEach(() => {
    registry = new Registry();
    jest.clearAllMocks();
  });

  describe('_availableActions getter', () => {
    it('filters unwanted actions and adds scan action if editable', async() => {
      const actions = registry._availableActions;

      expect(Array.isArray(actions)).toBe(true);
      const scanAction = actions.find((a) => a.action === 'scanRegistry');

      expect(scanAction).toBeTruthy();

      // Test invoke() happy path
      const fakeSave = jest.fn().mockResolvedValue();

      registry.$dispatch.mockResolvedValue({ save: fakeSave });
      await scanAction.invoke({}, [{ _model: registry }]);

      expect(registry.$dispatch).toHaveBeenCalledWith('create', expect.any(Object));
      expect(fakeSave).toHaveBeenCalled();
      expect(registry.$dispatch).toHaveBeenCalledWith(
        'growl/success',
        expect.any(Object),
        { root: true }
      );
    });

    it('handles scanAction.invoke() failure gracefully', async() => {
      const actions = registry._availableActions;
      const scanAction = actions.find((a) => a.action === 'scanRegistry');
      const fakeSave = jest.fn().mockRejectedValue(new Error('fail!'));

      registry.$dispatch.mockResolvedValue({ save: fakeSave });
      await scanAction.invoke({}, [{ _model: registry }]);
      expect(registry.$dispatch).toHaveBeenCalledWith(
        'growl/error',
        expect.any(Object),
        { root: true }
      );
    });

    it('skips scan action if cannot edit', () => {
      registry.canEdit = false;
      const actions = registry._availableActions;

      expect(actions.some((a) => a.action === 'scanRegistry')).toBe(false);
    });

    it('skips scan action if inside detail route', () => {
      registry.$rootState.targetRoute = { params: { id: '123' } };
      const actions = registry._availableActions;

      expect(actions.every((a) => a.action !== 'scanRegistry')).toBe(true);
    });
  });

  describe('listLocation and navigation getters', () => {
    it('returns correct route info', () => {
      expect(registry.listLocation.name).toContain('registries');
      expect(registry.doneOverride).toEqual(registry.listLocation);
      expect(registry.parentLocationOverride).toEqual(registry.listLocation);
    });
  });

  describe('scanRec - status, statusResult is undefined', () => {
    const baseScan = () => ({
      metadata: { namespace: 'ns1' },
      spec:     { registry: 'reg1' },
    });

    it('returns scan record correctly with 2 scanjobs', () => {
      registry.$getters.all.mockReturnValue([
        baseScan(),
        baseScan()
      ]);

      const rec = registry.scanRec;

      expect(rec.currStatus).toBe('pending');
      expect(rec.previousScan.prevScanStatus).toBe('pending');
      expect(rec.progress.registryName).toBe('reg1');
    });
  });

  describe('scanRec', () => {
    const baseScan = (type, time, progress = 50, failed = false) => ({
      metadata: { namespace: 'ns1' },
      spec:     { registry: 'reg1' },
      status:   {
        conditions:         [{ type, lastTransitionTime: new Date(time).toISOString() }],
        scannedImagesCount: 2,
        imagesCount:        4,
        completionTime:     new Date(time + 1000).toISOString()
      },
      statusResult: {
        type,
        progress,
        lastTransitionTime: new Date(time).toISOString(),
        statusIndex:        1,
        message:            failed ? 'failmsg' : ''
      }
    });

    it('returns scan record correctly with 2 scanjobs', () => {
      registry.$getters.all.mockReturnValue([
        baseScan('Complete', Date.now() - 10000),
        baseScan('Failed', Date.now() - 20000, 80, true),
        baseScan('Complete', Date.now() - 30000),
      ]);

      const rec = registry.scanRec;

      expect(rec.currStatus).toBe('complete');
      expect(rec.previousScan.prevScanStatus).toBe('failed');
      expect(rec.progress.registryName).toBe('reg1');
      expect(rec.progress.error).toBe('');
      expect(typeof rec.previousStatus).toBe('string');
    });

    it('returns scan record correctly with 2 scanjobs', () => {
      registry.$getters.all.mockReturnValue([
        baseScan('Failed', Date.now() - 10000, 70, true),
        baseScan('Failed', Date.now() - 20000, 80, true),
        baseScan('Complete', Date.now() - 30000),
      ]);

      const rec = registry.scanRec;

      expect(rec.currStatus).toBe('failed');
      expect(rec.previousScan.prevScanStatus).toBe('failed');
      expect(rec.progress.registryName).toBe('reg1');
      expect(rec.progress.error).toBe('failmsg');
      expect(typeof rec.previousStatus).toBe('string');
    });

    it('returns null when no id', () => {
      registry.id = null;
      expect(registry.scanRec).toBeNull();
    });

    it('handles missing status arrays gracefully', () => {
      registry.$getters.all.mockReturnValue([{ metadata: { namespace: 'ns1' }, spec: { registry: 'reg1' } }]);
      const rec = registry.scanRec;

      expect(rec.currStatus).toBe('pending');
    });
    it('handles missing status arrays gracefully - no scan started', () => {
      registry.$getters.all.mockReturnValue([]);
      const rec = registry.scanRec;

      expect(rec.currStatus).toBe('none');
    });

    it('get latest 2 scanjobs - without conditions (Cover sorting logic)', () => {
      const time = new Date();
      const type = 'none';
      const progress = 70;

      registry.$getters.all.mockReturnValue([
        {
          metadata: { namespace: 'ns1' },
          spec:     { registry: 'reg1' },
          status:   {
            scannedImagesCount: 2,
            imagesCount:        4,
            completionTime:     new Date(time + 1000).toISOString()
          },
          statusResult: {
            type,
            progress,
            lastTransitionTime: new Date(time).toISOString(),
            statusIndex:        1,
          }
        },
        {
          metadata: { namespace: 'ns1' },
          spec:     { registry: 'reg1' },
          status:   {
            scannedImagesCount: 2,
            imagesCount:        4,
            completionTime:     new Date(time + 1000).toISOString(),
            conditions:         [{
              type: 'Complete', status: true, lastTransitionTime: new Date(time - 10000).toISOString()
            }],
          },
          statusResult: {
            type,
            progress,
            lastTransitionTime: new Date(time).toISOString(),
            statusIndex:        1,
          }
        },
        {
          metadata: { namespace: 'ns1' },
          spec:     { registry: 'reg1' },
          status:   {
            scannedImagesCount: 2,
            imagesCount:        4,
            completionTime:     new Date(time + 1000).toISOString()
          },
          statusResult: {
            type,
            progress,
            lastTransitionTime: new Date(time).toISOString(),
            statusIndex:        1,
          }
        }
      ]);

      const rec = registry.scanRec;

      expect(rec.currStatus).toBe('none');
      expect(rec.previousScan.prevScanStatus).toBe('none');
      expect(rec.progress.registryName).toBe('reg1');
      expect(typeof rec.previousStatus).toBe('string');
    });

    it('get latest 2 scanjobs - without status and statusResult', () => {
      registry.$getters.all.mockReturnValue([
        {
          metadata: { namespace: 'ns1' },
          spec:     { registry: 'reg1' },
        },
        {
          metadata: { namespace: 'ns1' },
          spec:     { registry: 'reg1' },
        },
        {
          metadata: { namespace: 'ns1' },
          spec:     { registry: 'reg1' },
        }
      ]);

      const rec = registry.scanRec;

      expect(rec.currStatus).toBe('pending');
      expect(rec.previousScan.prevScanStatus).toBe('pending');
      expect(rec.progress.registryName).toBe('reg1');
    });
  });

  describe('getPreviousStatus()', () => {
    it('returns previous condition type if index < 3', () => {
      const conds = [{ type: 'A' }, { type: 'B' }];
      const scan = [{ status: { conditions: conds }, statusResult: { statusIndex: 1 } }];

      expect(registry.getPreviousStatus(scan)).toBe('a');
    });

    it('returns earlier condition if index >= 3', () => {
      const conds = [{ type: 'A' }, { type: 'B' }, { type: 'C' }];
      const scan = [{ status: { conditions: conds }, statusResult: { statusIndex: 3 } }];

      expect(registry.getPreviousStatus(scan)).toBe('b');
    });

    it('returns earlier condition if index >= 3 - Cover condition is undefined with statusIndex === 3', () => {
      const scan = [{ status: {}, statusResult: { statusIndex: 3 } }];

      expect(registry.getPreviousStatus(scan)).toBe('none');
    });

    it('returns earlier condition if index >= 3 - Cover condition is undefined with statusIndex === 2', () => {
      const scan = [{ status: {}, statusResult: { statusIndex: 2 } }];

      expect(registry.getPreviousStatus(scan)).toBe('none');
    });

    it('returns from second scan if no statusIndex', () => {
      const scan = [
        { statusResult: {} },
        { statusResult: { type: 'Other' } }
      ];

      expect(registry.getPreviousStatus(scan)).toBe('other');
    });

    it('returns none when empty', () => {
      expect(registry.getPreviousStatus([])).toBe('none');
    });
  });

  describe('getLastTransitionTime()', () => {
    it('returns max timestamp', () => {
      const result = registry.getLastTransitionTime([
        { lastTransitionTime: '2024-01-01T00:00:00Z' },
        { lastTransitionTime: '2025-01-01T00:00:00Z' },
      ]);

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('fetchSecondaryResources()', () => {
    it('does nothing if canPaginate=true', async() => {
      const res = await registry.fetchSecondaryResources({ canPaginate: true });

      expect(res).toBeUndefined();
    });

    it('dispatches cluster/findAll otherwise', async() => {
      registry.$store = { dispatch: jest.fn().mockResolvedValue('ok') };
      const res = await registry.fetchSecondaryResources({ canPaginate: false });

      expect(registry.$store.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.SCAN_JOB });
      expect(res).toBe('ok');
    });
  });
});
