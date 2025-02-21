import { Store } from 'vuex';
import { describe, beforeEach, it, expect } from '@jest/globals';

import { CatalogApp, Chart } from '@kubewarden/types';
import * as util from '@kubewarden/utils/chart';

describe('refreshCharts', () => {
  let store: Store<any>;
  let dispatchMock: jest.Mock;
  let gettersMock: jest.Mock;

  beforeEach(() => {
    dispatchMock = jest.fn();
    gettersMock = jest.fn().mockReturnValue({});
    store = {
      dispatch: dispatchMock,
      getters:  { 'catalog/rawCharts': gettersMock },
    } as unknown as Store<any>;
  });

  it('should refresh the charts if the specified chart is not found', async() => {
    gettersMock.mockReturnValue({});
    dispatchMock.mockResolvedValue(true);

    await util.refreshCharts({
      store,
      chartName: 'myChart',
      retry:     0,
      init:      false
    });

    expect(dispatchMock).toHaveBeenCalledWith('kubewarden/updateRefreshingCharts', true);
    expect(dispatchMock).toHaveBeenCalledWith('catalog/refresh');
    expect(dispatchMock).toHaveBeenCalledWith('kubewarden/updateRefreshingCharts', false);
  });

  it('should not retry more than 3 times', async() => {
    gettersMock.mockReturnValue({});
    dispatchMock.mockResolvedValue(true);

    await util.refreshCharts({
      store,
      chartName: 'myChart',
      retry:     3,
      init:      false
    });

    expect(dispatchMock).toHaveBeenCalledTimes(0);
  });
});

describe('appVersionSatisfiesConstraint', () => {
  let store: Store<any>;

  beforeEach(() => {
    store = { getters: { 'prefs/get': jest.fn() } } as unknown as Store<any>;
  });

  it('should return false if installedAppVersion is not provided', () => {
    const result = util.appVersionSatisfiesConstraint(store, '');

    expect(result).toBe(false);
  });

  it('should return true if targetAppVersion is not provided', () => {
    const result = util.appVersionSatisfiesConstraint(store, '1.0.0');

    expect(result).toBe(true);
  });

  it('should return false when semver.satisfies returns false for `>=` constraint', () => {
    store.getters['prefs/get'] = jest.fn().mockReturnValue(false);

    const result = util.appVersionSatisfiesConstraint(store, '1.0.0', '2.0.0', '>=');

    expect(result).toBe(false);
  });

  it('should return true when semver.satisfies returns true for `<=` constraint', () => {
    store.getters['prefs/get'] = jest.fn().mockReturnValue(true);

    const result = util.appVersionSatisfiesConstraint(store, '1.0.0', '1.1.0', '<=');

    expect(result).toBe(true);
  });

  it('should return true when semver.satisfies returns true for `=` constraint', () => {
    store.getters['prefs/get'] = jest.fn().mockReturnValue(true);

    const result = util.appVersionSatisfiesConstraint(store, '1.0.0', '1.0.0', '=');

    expect(result).toBe(true);
  });
});

describe('checkUpgradeAvailable', () => {
  let store: Store<any>;
  let gettersMock: jest.Mock;

  beforeEach(() => {
    gettersMock = jest.fn().mockReturnValue(true);
    store = { getters: { 'prefs/get': gettersMock } } as unknown as Store<any>;
  });

  it('should return null if app or chart is not provided', () => {
    const result = util.checkUpgradeAvailable(store, null, null);

    expect(result).toBeNull();
  });

  it('should return null if no appVersion is found in the app', () => {
    const app = { spec: { chart: { metadata: {} } } } as CatalogApp;
    const chart = {} as Chart;

    const result = util.checkUpgradeAvailable(store, app, chart);

    expect(result).toBeNull();
  });

  it('should return the highest available upgrade version', () => {
    const app = {
      spec: {
        chart: {
          metadata: {
            appVersion: '1.0.0',
            version:    '1.0.0'
          }
        }
      }
    } as CatalogApp;
    const chart = {
      versions: [{
        appVersion: '1.1.0',
        version:    '1.1.0'
      }]
    } as Chart;

    const result = util.checkUpgradeAvailable(store, app, chart);

    expect(result).toEqual({
      appVersion: '1.1.0',
      version:    '1.1.0'
    });
  });

  it('should return null if no upgrade version is available', () => {
    const app = {
      spec: {
        chart: {
          metadata: {
            appVersion: '1.0.0',
            version:    '1.0.0'
          }
        }
      }
    } as CatalogApp;
    const chart = {
      versions: [{
        appVersion: '1.0.0',
        version:    '1.0.0'
      }]
    } as Chart;

    const result = util.checkUpgradeAvailable(store, app, chart);

    expect(result).toBeNull();
  });
});

describe('findCompatibleDefaultsChart', () => {
  it('should return null if controllerApp or defaultsChart is not provided', () => {
    const result = util.findCompatibleDefaultsChart(null, null);

    expect(result).toBeNull();
  });

  it('should return null if no matching version is found', () => {
    const controllerApp = { spec: { chart: { metadata: { appVersion: '1.0.0' } } } } as CatalogApp;
    const defaultsChart = {
      versions: [{
        appVersion: '2.0.0',
        version:    '2.0.0'
      }]
    } as Chart;

    const result = util.findCompatibleDefaultsChart(controllerApp, defaultsChart);

    expect(result).toBeNull();
  });

  it('should return the highest matching version', () => {
    const controllerApp = { spec: { chart: { metadata: { appVersion: '1.0.0' } } } } as CatalogApp;
    const defaultsChart = {
      versions: [{
        appVersion: '1.0.0',
        version:    '1.0.1'
      }, {
        appVersion: '1.0.0',
        version:    '1.0.2'
      }]
    } as Chart;

    const result = util.findCompatibleDefaultsChart(controllerApp, defaultsChart);

    expect(result).toEqual({
      appVersion: '1.0.0',
      version:    '1.0.2'
    });
  });
});

describe('getValidUpgrade', () => {
  it('should return null if currentVersion or upgradeVersion is not provided', () => {
    const result = util.getValidUpgrade('', '1.0.0', '');

    expect(result).toBeNull();
  });

  it('should return null if upgradeVersion is not higher than currentVersion', () => {
    const result = util.getValidUpgrade('1.0.0', '0.9.0', '');

    expect(result).toBeNull();
  });

  it('should return upgradeVersion if it is a valid upgrade', () => {
    const result = util.getValidUpgrade('1.0.0', '1.1.0', '');

    expect(result).toBe('1.1.0');
  });

  it('should return upgradeVersion if it is higher than the current highestVersion', () => {
    const result = util.getValidUpgrade('1.0.0', '1.1.0', '1.0.1');

    expect(result).toBe('1.1.0');
  });
});
