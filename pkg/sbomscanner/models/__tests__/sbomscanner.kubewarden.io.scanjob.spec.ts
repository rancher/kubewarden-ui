import Scanjob from '../sbomscanner.kubewarden.io.scanjob';

// Mock SteveModel (since it's a base class from Rancher)
jest.mock('@shell/plugins/steve/steve-class', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('Scanjob model', () => {
  let scanjob: any;

  beforeEach(() => {
    scanjob = Object.create((Scanjob as any).prototype);
  });

  it('returns default Pending status if status is missing', () => {
    // simulate a scanjob without status
    scanjob.status = undefined;
    const result = scanjob.statusResult;

    expect(result).toEqual({
      type:               'Pending',
      lastTransitionTime: null,
      statusIndex:        -1,
      progress:           0
    });
  });

  it('returns Pending if conditions array is empty - conditions is undefined', () => {
    scanjob.status = {
      imagesCount:        5,
      scannedImagesCount: 3
    };
    const result = scanjob.statusResult;

    expect(result.type).toBe('Pending');
    expect(result.progress).toBe(0);
    expect(result.statusIndex).toBe(-1);
  });

  it('returns Pending if conditions array is empty', () => {
    scanjob.status = {
      conditions:         [],
      imagesCount:        5,
      scannedImagesCount: 3
    };
    const result = scanjob.statusResult;

    expect(result.type).toBe('Pending');
    expect(result.progress).toBe(0);
    expect(result.statusIndex).toBe(-1);
  });

  it('returns Pending if no condition has status=True', () => {
    scanjob.status = {
      conditions: [
        { status: 'False', type: 'Scheduled' },
        { status: 'False', type: 'Pending' },
        { status: 'False', type: 'Complete' },
        { status: 'False', type: 'Failed' },
      ],
      imagesCount:        10,
      scannedImagesCount: 2
    };
    const result = scanjob.statusResult;

    expect(result.type).toBe('Pending');
    expect(result.progress).toBe(0);
  });

  it('returns actual condition when condition.status=True', () => {
    scanjob.status = {
      conditions: [
        {
          status: 'False', type: 'Scheduled', lastTransitionTime: '2025-10-23T12:16:10.000Z'
        },
        {
          status: 'False', type: 'Pending', lastTransitionTime: '2025-10-24T12:16:10.000Z'
        },
        {
          status: 'True', type: 'Complete', lastTransitionTime: '2025-10-26T12:16:10.000Z'
        },
        {
          status: 'False', type: 'Failed', lastTransitionTime: '2025-10-25T12:16:10.000Z'
        },
      ],
      imagesCount:        10,
      scannedImagesCount: 5
    };

    const result = scanjob.statusResult;

    expect(result.type).toBe('Complete');
    expect(result.statusIndex).toBe(2);
    expect(result.progress).toBe(50);
    expect(typeof result.lastTransitionTime).toBe('number');
    expect(result.lastTransitionTime).toBe(1761480970000);
  });

  it('handles progress when scannedImagesCount is 0', () => {
    scanjob.status = {
      conditions: [
        {
          type: 'InProgress', status: 'True', lastTransitionTime: '2025-10-25T09:00:00Z', message: 'Scanning'
        }
      ],
      imagesCount:        10,
      scannedImagesCount: 0
    };

    const result = scanjob.statusResult;

    expect(result.progress).toBe(0);
  });

  it('handles missing imagesCount gracefully (no division by zero)', () => {
    scanjob.status = {
      conditions: [
        {
          type: 'Pending', status: 'True', lastTransitionTime: '2025-10-25T09:00:00Z', message: 'Still going'
        }
      ],
      scannedImagesCount: 10
    };

    const result = scanjob.statusResult;

    expect(result.progress).toBe(0);
    expect(result.type).toBe('Pending');
  });

  it('handles missing imagesCount gracefully (denominator is undefined)', () => {
    scanjob.status = {
      conditions: [
        {
          type: 'Pending', status: 'False', lastTransitionTime: '2025-10-25T09:00:00Z', message: 'Still going'
        },
        {
          type: 'Pending', status: 'True', lastTransitionTime: '2025-10-25T09:00:00Z', message: 'Still going'
        }
      ],
    };

    const result = scanjob.statusResult;

    expect(result.progress).toBe(0);
    expect(result.type).toBe('Pending');
  });
});
