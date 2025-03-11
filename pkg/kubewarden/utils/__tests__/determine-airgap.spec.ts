import { isAirgap } from '@kubewarden/utils/determine-airgap';

describe('isAirgap', () => {
  let store: any;
  let context: { store: any };

  beforeEach(() => {
    store = {
      dispatch: jest.fn(),
      getters:  {}
    };
    context = { store };
  });

  it('returns false and updates airGapped as false when request returns status 200', async() => {
    store.dispatch.mockResolvedValueOnce(null);
    store.getters['management/byId'] = jest.fn().mockReturnValue({ value: 'example.com,other.com' });
    store.dispatch.mockResolvedValueOnce({ _status: 200 });

    const result = await isAirgap(context);

    expect(store.dispatch).toHaveBeenCalledWith('kubewarden/updateAirGapped', false);
    expect(result).toBe(false);
  });

  it('returns false and updates airGapped as false when request returns status 302', async() => {
    store.dispatch.mockResolvedValueOnce(null);
    store.getters['management/byId'] = jest.fn().mockReturnValue({ value: 'example.com,other.com' });
    store.dispatch.mockResolvedValueOnce({ _status: 302 });

    const result = await isAirgap(context);

    expect(store.dispatch).toHaveBeenCalledWith('kubewarden/updateAirGapped', false);
    expect(result).toBe(false);
  });

  it('returns true and updates airGapped as true when request returns non-success status', async() => {
    store.dispatch.mockResolvedValueOnce(null);
    store.getters['management/byId'] = jest.fn().mockReturnValue({ value: 'example.com,other.com' });
    store.dispatch.mockResolvedValueOnce({ _status: 404 });

    const result = await isAirgap(context);

    expect(store.dispatch).toHaveBeenCalledWith('kubewarden/updateAirGapped', true);
    expect(result).toBe(true);
  });

  it('returns false and updates airGapped as false when whitelist is empty', async() => {
    store.dispatch.mockResolvedValueOnce(null);
    store.getters['management/byId'] = jest.fn().mockReturnValue({});

    const result = await isAirgap(context);

    expect(store.dispatch).toHaveBeenCalledWith('kubewarden/updateAirGapped', false);
    expect(result).toBe(false);
  });

  it('catches errors, logs them, dispatches updateAirGapped false and returns false', async() => {
    const error = new Error('Test error');

    store.dispatch.mockRejectedValueOnce(error);
    store.getters['kubewarden/airGapped'] = false;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await isAirgap(context);

    expect(consoleSpy).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith('kubewarden/updateAirGapped', false);
    expect(result).toBe(false);

    consoleSpy.mockRestore();
  });
});
