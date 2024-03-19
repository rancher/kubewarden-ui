import { CATALOG } from '@shell/config/labels-annotations';
import { KUBEWARDEN_APPS } from '@kubewarden/types';
import { fetchControllerApp } from '@kubewarden/modules/kubewardenController';

const mockStore = {
  getters:  { 'cluster/schemaFor': jest.fn() },
  dispatch: jest.fn(),
};

beforeEach(() => { //
  jest.clearAllMocks();
});

describe('fetchControllerApp', () => {
  it('should fetch and return the controller app when found', async() => {
    const expectedControllerApp = { spec: { chart: { metadata: { annotations: { [CATALOG.RELEASE_NAME]: KUBEWARDEN_APPS.RANCHER_CONTROLLER } } } } };

    mockStore.getters['cluster/schemaFor'].mockReturnValue(true);
    mockStore.dispatch.mockResolvedValue([expectedControllerApp]);

    const result = await fetchControllerApp(mockStore);

    expect(result).toEqual(expectedControllerApp);
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/updateControllerApp', expectedControllerApp);
  });

  it('should return undefined if the controller app is not found', async() => {
    mockStore.getters['cluster/schemaFor'].mockReturnValue(true);
    mockStore.dispatch.mockResolvedValue([]);

    const result = await fetchControllerApp(mockStore);

    expect(result).toBeUndefined();
    expect(mockStore.dispatch).not.toHaveBeenCalledWith('kubewarden/updateControllerApp', expect.anything());
  });

  it('should not proceed if the schema for CATALOG.APP is not found', async() => {
    mockStore.getters['cluster/schemaFor'].mockReturnValue(false);

    const result = await fetchControllerApp(mockStore);

    expect(result).toBeUndefined();
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });
});