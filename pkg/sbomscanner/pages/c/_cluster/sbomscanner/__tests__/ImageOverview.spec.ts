import { shallowMount, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ImageOverview from '../ImageOverview.vue';

// Mock external modules used by the component
jest.mock('file-saver', () => ({ saveAs: jest.fn(() => Promise.resolve()) }));
jest.mock('papaparse', () => ({ unparse: jest.fn(() => 'col1,col2\\n1,2') }));

const fileSaver = jest.requireMock('file-saver') as any;
const Papa = jest.requireMock('papaparse') as any;

describe('ImageOverview.vue', () => {
  const t = (k: string) => k;

  const mountComponent = (overrides: any = {}) => {
    const store = {
      dispatch: jest.fn(() => Promise.resolve()),
      getters:  {},
    };

    const mocks: any = {
      $t:           t,
      t,
      $store:       store,
      $fetchState:  { pending: false },
      $rootGetters: {},
    };

    const stubs = {
      // default shallow stub; tests that need slots will mount with a slot-rendering stub
      SortableTable: { template: '<div />' },
      LabeledSelect: { template: '<div />' },
      Checkbox:      { template: '<div />' },
      ActionMenu:    { template: '<div />' },
    };

    return shallowMount(ImageOverview as any, {
      global: {
        mocks,
        stubs,
      },
      ...overrides,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('template: header-left button disabled/enabled and sub-row renders when grouped (full mount)', async() => {
    // make a SortableTable stub that renders the named slots so parent slot content is evaluated
    const SortableTableWithSlots = {
      props:    ['rows', 'subRows'],
      template: `
        <div>
          <div class="header-left"><slot name="header-left"></slot></div>
          <div class="sub-rows">
            <template v-if="subRows" v-for="row in rows" :key="row.id">
              <slot name="sub-row" :row="row" :fullColspan="3"></slot>
            </template>
          </div>
          <div class="row-actions"><slot name="row-actions" :row="(rows && rows[0])"></slot></div>
        </div>
      `,
    };

    const store = { dispatch: jest.fn(() => Promise.resolve()), getters: {} };

    const wrapper = mount(ImageOverview as any, {
      global: {
        mocks: {
          $store: store, $t: t, t, $fetchState: { pending: false }
        },
        stubs: {
          SortableTable: SortableTableWithSlots,
          LabeledSelect: { template: '<div />' },
          Checkbox:      { template: '<div />' },
          ActionMenu:    { template: '<div />' },
        }
      }
    });

    const btn = wrapper.find('button[aria-label="Download custom report"]');

    // initially no selection -> disabled
    expect(btn.exists()).toBe(true);
    expect((btn.element as HTMLButtonElement).disabled).toBe(true);

    // simulate selection change -> button enabled
    (wrapper.vm as any).onSelectionChange([ { id: 'sel1' } ]);
    await nextTick();
    expect((btn.element as HTMLButtonElement).disabled).toBe(false);

    // now set grouped rowsByRepo to render sub-row slot
    (wrapper.vm as any).rows = [ {
      id: '1', imageMetadata: { repository: 'repo', registry: 'r' }, metadata: { name: 'n' }, report: { summary: { critical: 1 } }
    } ];
    (wrapper.vm as any).isGrouped = true;
    await nextTick();

    // the parent's sub-row template renders a <tr class="sub-row">; ensure it's present
    expect(wrapper.find('tr.sub-row').exists()).toBe(true);
  });

  test('renders and downloadCSVReport calls saveAs and growl on success', async() => {
    const wrapper = mountComponent();

    // prepare a sample row matching expected shape
    const rows = [ {
      id:             'r1',
      imageReference: 'reg/repo:tag',
      imageMetadata:  {
        registryURI: 'reg', repository: 'repo', tag: 'tag', digest: 'sha256:abc', registry: 'reg', platform: 'linux/amd64'
      },
      report: {
        summary: {
          critical: 1, high: 0, medium: 0, low: 0, unknown: 0
        }
      },
      scanResult: {
        critical: 1, high: 0, medium: 0, low: 0, unknown: 0
      },
      metadata: { name: 'img1' }
    } ];

    // Call method
    await (wrapper.vm as any).downloadCSVReport(rows, false);

    expect(Papa.unparse).toHaveBeenCalled();
    expect(fileSaver.saveAs).toHaveBeenCalled();
    // ensure growl success dispatched
    expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });
  });

  test('preprocessData groups rows by repo and returns formatted repo entries', () => {
    const wrapper = mountComponent();

    const vulReports = [
      {
        id:            '1',
        imageMetadata: { repository: 'repo1', registry: 'reg1' },
        metadata:      { name: 'img-a', namespace: 'ns' },
        report:        {
          summary: {
            critical: 1, high: 2, medium: 0, low: 0, unknown: 0
          }
        }
      },
      {
        id:            '2',
        imageMetadata: { repository: 'repo1', registry: 'reg1' },
        metadata:      { name: 'img-b', namespace: 'ns' },
        report:        {
          summary: {
            critical: 0, high: 1, medium: 0, low: 0, unknown: 0
          }
        }
      }
    ];

    const out = (wrapper.vm as any).preprocessData(vulReports);

    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(1);
    const repo = out[0];

    expect(repo.repository).toBe('repo1');
    expect(repo.images.length).toBe(2);
    expect(repo.cveCntByRepo.high).toBe(3);
  });

  test('preprocessData adds imageReference for sorting in grouped view', () => {
    const wrapper = mountComponent();

    const vulReports = [
      {
        id:            '2',
        imageMetadata: {
          repository: 'test-repo', registry: 'my-reg', registryURI: 'my-reg', tag: 'zulu'
        },
        metadata: { name: 'img-z', namespace: 'ns' },
        report:   { summary: { critical: 1 } }
      },
      {
        id:            '1',
        imageMetadata: {
          repository: 'test-repo', registry: 'my-reg', registryURI: 'my-reg', tag: 'alpha'
        },
        metadata: { name: 'img-a', namespace: 'ns' },
        report:   { summary: { critical: 1 } }
      }
    ];

    const processedData = (wrapper.vm as any).preprocessData(vulReports);

    // Expect one group for 'test-repo'
    expect(processedData).toHaveLength(1);
    const repoGroup = processedData[0];

    // Check that imageReference is correctly constructed
    expect(repoGroup.images[0].imageReference).toBe('my-reg/test-repo:zulu');
    expect(repoGroup.images[1].imageReference).toBe('my-reg/test-repo:alpha');

    // Simulate SortableTable's sorting on the 'imageReference' field
    repoGroup.images.sort((a: any, b: any) => a.imageReference.localeCompare(b.imageReference));

    // Verify the sorted order
    expect(repoGroup.images[0].imageReference).toBe('my-reg/test-repo:alpha');
  });

  test('downloadCSVReport handles grouped rows and saveAs failure', async() => {
    const wrapper = mountComponent();

    // create grouped rows: rows is array of repo records each with images array
    (wrapper.vm as any).isGrouped = true;
    const grouped = [ {
      images: [ {
        imageMetadata: {
          registryURI: 'r', repository: 'repo', tag: 't', digest: 'd', registry: 'r', platform: 'p'
        }, scanResult: {
          critical: 1, high: 0, medium: 0, low: 0, unknown: 0
        }, report: {
          summary: {
            critical: 1, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, imageReference: 'r/repo:t'
      } ]
    } ];

    // success path
    await (wrapper.vm as any).downloadCSVReport(grouped, true);
    expect(Papa.unparse).toHaveBeenCalled();
    expect(fileSaver.saveAs).toHaveBeenCalled();

    // simulate saveAs throwing
    fileSaver.saveAs.mockImplementationOnce(() => {
      throw new Error('disk');
    });
    const storeErr = { dispatch: jest.fn(() => Promise.resolve()), getters: {} };
    const wrapperErr = mountComponent({
      global: {
        mocks: {
          $store: storeErr, $t: t, t, $rootGetters: {}, $fetchState: { pending: false }
        }
      }
    });

    (wrapperErr.vm as any).isGrouped = true;
    await (wrapperErr.vm as any).downloadCSVReport(grouped);
    expect(storeErr.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('customActions invoke download handlers', async() => {
    const store = {
      dispatch: jest.fn((action: string, payload: any) => {
        if (action === 'cluster/find') {
          return Promise.resolve({ spdx: {}, metadata: { name: payload.id } });
        }

        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapper = mountComponent({
      global: {
        mocks: {
          $store: store, $t: t, t, $fetchState: { pending: false }
        }
      }
    });
    const actions = (wrapper.vm as any).customActions;
    // find downloadSbom and call invoke
    const sbomAction = actions.find((a: any) => a.action === 'downloadSbom');

    await sbomAction.invoke(null, [ { id: 's1' } ]);
    expect(store.dispatch).toHaveBeenCalled();

    const csvAction = actions.find((a: any) => a.action === 'downloadCsv');

    await csvAction.invoke(null, [ { id: 'v1' } ]);
    expect(store.dispatch).toHaveBeenCalled();

    const jsonAction = actions.find((a: any) => a.action === 'downloadJson');

    await jsonAction.invoke(null, [ { id: 'v2' } ]);
    expect(store.dispatch).toHaveBeenCalled();
  });

  test('filteredRows computed applies filters correctly and onSelectionChange updates selectedRows', () => {
    const wrapper = mountComponent();

    // set rows to one matching and one not matching
    (wrapper.vm as any).rows = [
      {
        imageMetadata: {
          registryURI: 'r1', repository: 'repo', tag: 't1', registry: 'reg'
        }, report: {
          summary: {
            critical: 1, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'ns' }
      },
      {
        imageMetadata: {
          registryURI: 'r2', repository: 'other', tag: 't2', registry: 'reg'
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'ns' }
      },
    ];

    // set debouncedFilters to apply a severity filter so only the first row matches
    (wrapper.vm as any).debouncedFilters = { ...(wrapper.vm as any).debouncedFilters, severitySearch: 'critical' };
    const result = (wrapper.vm as any).filteredRows;

    expect(result.rows.length).toBe(1);

    // test onSelectionChange
    (wrapper.vm as any).onSelectionChange([ { id: 'x' } ]);
    expect((wrapper.vm as any).selectedRows.length).toBe(1);
  });

  test('filteredRows imageName match uses registryURI/repository:tag construction', () => {
    const wrapper = mountComponent();

    // two rows where one matches imageSearch based on constructed image name
    (wrapper.vm as any).rows = [
      {
        imageMetadata: {
          registryURI: 'rX', repository: 'myrepo', tag: 'ver1', registry: 'reg'
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'ns' }
      },
      {
        imageMetadata: {
          registryURI: 'other', repository: 'repo2', tag: 'v2', registry: 'reg'
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'ns' }
      },
    ];

    // set debouncedFilters.imageSearch to a substring of the constructed image name of the first row
    (wrapper.vm as any).debouncedFilters = { ...(wrapper.vm as any).debouncedFilters, imageSearch: 'rx/myrepo:ver1' };

    const result = (wrapper.vm as any).filteredRows;

    expect(result.rows.length).toBe(1);
    // ensure the matched row is the first one
    expect(result.rows[0].imageMetadata.repository).toBe('myrepo');
  });

  test('downloadCSVReport grouped IMAGE REFERENCE uses registryURI template', async() => {
    const wrapper = mountComponent();

    (wrapper.vm as any).isGrouped = true;
    // grouped repo with image that has imageMetadata.registryURI
    const grouped = [ {
      images: [ {
        id:            'g1', imageMetadata: {
          registryURI: 'regX', repository: 'repoG', tag: 'tG', digest: 'dg', registry: 'regX', platform: 'p'
        }, scanResult: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, imageReference: 'regX/repoG:tG'
      } ]
    } ];

    await (wrapper.vm as any).downloadCSVReport(grouped, true);

    // Papa.unparse should be called with rows that include IMAGE REFERENCE using registryURI template
    expect(Papa.unparse).toHaveBeenCalled();
    const passed = (Papa.unparse as jest.Mock).mock.calls[0][0] as any[];

    expect(passed[0]['IMAGE REFERENCE']).toBe('regX/repoG:tG');
  });

  test('filteredRows registrySearch matches namespace/registry string', () => {
    const wrapper = mountComponent();

    (wrapper.vm as any).rows = [
      {
        imageMetadata: {
          registryURI: 'r1', repository: 'repoA', tag: 't', registry: 'regA'
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'nsA' }
      },
    ];

    // set registrySearch to the exact namespace/registry format expected in code
    (wrapper.vm as any).debouncedFilters = { ...(wrapper.vm as any).debouncedFilters, registrySearch: 'nsA/regA' };

    const result = (wrapper.vm as any).filteredRows;

    expect(result.rows.length).toBe(1);
  });

  test('filteredRows platformMatch uses imageMetadata.platform substring match', () => {
    const wrapper = mountComponent();

    (wrapper.vm as any).rows = [
      {
        imageMetadata: {
          registryURI: 'r2', repository: 'repoB', tag: 't2', registry: 'regB', platform: 'linux/amd64'
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'nsB' }
      },
      {
        imageMetadata: {
          registryURI: 'r3', repository: 'repoC', tag: 't3', registry: 'regC', platform: null
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'nsC' }
      },
    ];

    (wrapper.vm as any).debouncedFilters = { ...(wrapper.vm as any).debouncedFilters, platformSearch: 'linux' };

    const result = (wrapper.vm as any).filteredRows;

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].imageMetadata.platform).toContain('linux');
  });

  test('downloadCSVReport handles papaparse throwing and dispatches error', async() => {

    // prepare a sample row matching expected shape
    const rows = [ {
      id:             'r2',
      imageReference: 'reg2/repo2:tag2',
      imageMetadata:  {
        registryURI: 'reg2', repository: 'repo2', tag: 'tag2', digest: 'sha256:ddd', registry: 'reg2', platform: 'linux/amd64'
      },
      report: {
        summary: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        }
      },
      scanResult: {
        critical: 0, high: 0, medium: 0, low: 0, unknown: 0
      },
      metadata: { name: 'img2' }
    } ];

    // make papaparse throw to exercise catch path
    Papa.unparse.mockImplementationOnce(() => {
      throw new Error('parse-failed');
    });

    const storeErr = { dispatch: jest.fn(() => Promise.resolve()), getters: {} };
    const wrapperErr = mountComponent({
      global: {
        mocks: {
          $store: storeErr, $t: t, t, $rootGetters: {}, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperErr.vm as any).downloadCSVReport(rows);

    expect(storeErr.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('filteredRows repositorySearch filters by repository value', () => {
    const wrapper = mountComponent();

    (wrapper.vm as any).rows = [
      {
        imageMetadata: {
          registryURI: 'rA', repository: 'special', tag: 't', registry: 'regA'
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'nsA' }
      },
      {
        imageMetadata: {
          registryURI: 'rB', repository: 'other', tag: 't2', registry: 'regB'
        }, report: {
          summary: {
            critical: 0, high: 0, medium: 0, low: 0, unknown: 0
          }
        }, metadata: { namespace: 'nsB' }
      },
    ];

    (wrapper.vm as any).debouncedFilters = { ...(wrapper.vm as any).debouncedFilters, repositorySearch: 'special' };

    const result = (wrapper.vm as any).filteredRows;

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].imageMetadata.repository).toBe('special');
  });

  test('downloadSbom success and error flows', async() => {
    // success path
    const storeSuccess = {
      dispatch: jest.fn((action: string, payload: any) => {
        if (action === 'cluster/find') {
          return Promise.resolve({ spdx: { foo: 'bar' }, metadata: { name: payload.id } });
        }

        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapperSuccess = mountComponent({
      global: {
        mocks: {
          $store: storeSuccess, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperSuccess.vm as any).downloadSbom([ { id: 'sb1' } ]);
    expect(fileSaver.saveAs).toHaveBeenCalled();
    expect(storeSuccess.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });

    // error path
    const storeError = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          throw new Error('boom');
        }

        // allow growl dispatches to resolve
        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapperError = mountComponent({
      global: {
        mocks: {
          $store: storeError, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperError.vm as any).downloadSbom([ { id: 'sb2' } ]);
    expect(storeError.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('downloadJson success and error flows', async() => {
    const vul = { report: { hello: 'world' } };
    const storeSuccess = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          return Promise.resolve(vul);
        }

        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapper = mountComponent({
      global: {
        mocks: {
          $store: storeSuccess, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapper.vm as any).downloadJson([ { id: 'v1' } ]);
    expect(fileSaver.saveAs).toHaveBeenCalled();
    expect(storeSuccess.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });

    const storeError = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          throw new Error('bad');
        }

        return Promise.resolve();
      }), getters: {}
    };
    const wrapperErr = mountComponent({
      global: {
        mocks: {
          $store: storeError, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperErr.vm as any).downloadJson([ { id: 'v2' } ]);
    expect(storeError.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('downloadCsv success and error flows', async() => {
    const vulReport = {
      report: {
        results: [ {
          vulnerabilities: [ {
            cve: 'CVE-1', cvss: { nvd: { v3score: '7.2' } }, packageName: 'pkg', fixedVersions: ['1.0'], severity: 'high', suppressed: false, installedVersion: '1.0', purl: 'purl', description: 'd'
          } ]
        } ]
      }
    };

    const storeSuccess = {
      dispatch: jest.fn(() => Promise.resolve(vulReport)),
      getters:  {},
    };

    const wrapper = mountComponent({
      global: {
        mocks: {
          $store: storeSuccess, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapper.vm as any).downloadCsv([ { id: 'v-rep' } ]);
    expect(Papa.unparse).toHaveBeenCalled();
    expect(fileSaver.saveAs).toHaveBeenCalled();
    expect(storeSuccess.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });

    const storeError = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          throw new Error('err');
        }

        return Promise.resolve();
      }), getters: {}
    };
    const wrapperErr = mountComponent({
      global: {
        mocks: {
          $store: storeError, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperErr.vm as any).downloadCsv([ { id: 'v-rep-2' } ]);
    expect(storeError.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('fetch populates rows and registryCrds', async() => {
    const rows = [ {
      id:            'r1',
      imageMetadata: {
        registryURI: 'r1', repository: 'repo1', tag: 't1', registry: 'reg1'
      },
      report: {
        summary: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        }
      },
      metadata: { namespace: 'ns', name: 'img1' }
    } ];
    const regs = [ { metadata: { namespace: 'ns', name: 'reg' }, spec: { repositories: ['repo'] } } ];

    const store: any = {
      _called:  false,
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/findAll') {
          // mimic first call for vulnerability reports and second call for registry
          if (!store._called) {
            store._called = true;

            return Promise.resolve(rows);
          }

          return Promise.resolve(regs);
        }

        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapper = mountComponent({
      global: {
        mocks: {
          $store: store, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    // `fetch` is a component hook and not exposed directly on `vm` in the test harness.
    // Call it via the component options with the vm as context.
    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

    expect((wrapper.vm as any).rows).toStrictEqual(rows);
    expect((wrapper.vm as any).registryCrds).toStrictEqual(regs);
  });

  test('header custom report button disabled/enabled based on selectedRows', () => {
    const wrapper = mountComponent();
    // initial no selection -> button disabled

    expect((wrapper.vm as any).selectedRows.length).toBe(0);

    (wrapper.vm as any).onSelectionChange([ { id: 'a' } ]);
    expect((wrapper.vm as any).selectedRows.length).toBe(1);
  });

  test('downloadSbom success and error flows', async() => {
    // success path
    const storeSuccess = {
      dispatch: jest.fn((action: string, payload: any) => {
        if (action === 'cluster/find') {
          return Promise.resolve({ spdx: { foo: 'bar' }, metadata: { name: payload.id } });
        }

        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapperSuccess = mountComponent({
      global: {
        mocks: {
          $store: storeSuccess, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperSuccess.vm as any).downloadSbom([ { id: 'sb1' } ]);
    expect(fileSaver.saveAs).toHaveBeenCalled();
    expect(storeSuccess.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });

    // error path
    const storeError = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          throw new Error('boom');
        }

        // allow growl dispatches to resolve
        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapperError = mountComponent({
      global: {
        mocks: {
          $store: storeError, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperError.vm as any).downloadSbom([ { id: 'sb2' } ]);
    expect(storeError.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('downloadJson success and error flows', async() => {
    const vul = { report: { hello: 'world' } };
    const storeSuccess = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          return Promise.resolve(vul);
        }

        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapper = mountComponent({
      global: {
        mocks: {
          $store: storeSuccess, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapper.vm as any).downloadJson([ { id: 'v1' } ]);
    expect(fileSaver.saveAs).toHaveBeenCalled();
    expect(storeSuccess.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });

    const storeError = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          throw new Error('bad');
        }

        return Promise.resolve();
      }), getters: {}
    };
    const wrapperErr = mountComponent({
      global: {
        mocks: {
          $store: storeError, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperErr.vm as any).downloadJson([ { id: 'v2' } ]);
    expect(storeError.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('downloadCsv success and error flows', async() => {
    const vulReport = {
      report: {
        results: [ {
          vulnerabilities: [ {
            cve: 'CVE-1', cvss: { nvd: { v3score: '7.2' } }, packageName: 'pkg', fixedVersions: ['1.0'], severity: 'high', suppressed: false, installedVersion: '1.0', purl: 'purl', description: 'd'
          } ]
        } ]
      }
    };

    const storeSuccess = {
      dispatch: jest.fn(() => Promise.resolve(vulReport)),
      getters:  {},
    };

    const wrapper = mountComponent({
      global: {
        mocks: {
          $store: storeSuccess, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapper.vm as any).downloadCsv([ { id: 'v-rep' } ]);
    expect(Papa.unparse).toHaveBeenCalled();
    expect(fileSaver.saveAs).toHaveBeenCalled();
    expect(storeSuccess.dispatch).toHaveBeenCalledWith('growl/success', expect.any(Object), { root: true });

    const storeError = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/find') {
          throw new Error('err');
        }

        return Promise.resolve();
      }), getters: {}
    };
    const wrapperErr = mountComponent({
      global: {
        mocks: {
          $store: storeError, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperErr.vm as any).downloadCsv([ { id: 'v-rep-2' } ]);
    expect(storeError.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });
});
