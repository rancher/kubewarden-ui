export const scanJobs4General = {
  mock: [
    {
      id:    'cattle-sbomscanner-system/reg-xzgt47v',
      type:  'sbomscanner.kubewarden.io.scanjob',
      links: {
        remove:
            'https://localhost:8005/v1/sbomscanner.kubewarden.io.scanjobs/cattle-sbomscanner-system/reg-xzgt47v',
        self:
            'https://localhost:8005/v1/sbomscanner.kubewarden.io.scanjobs/cattle-sbomscanner-system/reg-xzgt47v',
        update:
            'https://localhost:8005/v1/sbomscanner.kubewarden.io.scanjobs/cattle-sbomscanner-system/reg-xzgt47v',
        view:
            'https://localhost:8005/apis/sbomscanner.kubewarden.io/v1alpha1/namespaces/cattle-sbomscanner-system/scanjobs/reg-xzgt47v'
      },
      apiVersion: 'sbomscanner.kubewarden.io/v1alpha1',
      kind:       'ScanJob',
      metadata:   {
        annotations: {
          'sbomscanner.kubewarden.io/creation-timestamp':
            '2025-10-23T23:51:12.654572779Z',
          'sbomscanner.kubewarden.io/registry':
            '{"kind":"Registry","apiVersion":"sbomscanner.kubewarden.io/v1alpha1","metadata":{"name":"reg-xz","namespace":"cattle-sbomscanner-system","uid":"813db1a7-1b19-4716-a8bc-1878115af45f","resourceVersion":"162925844","generation":1,"creationTimestamp":"2025-10-23T23:51:08Z"},"spec":{"uri":"ghcr.io","catalogType":"OCIDistribution","repositories":["kubewarden/sbomscanner/test-assets/golang"],"authSecret":"auth-xz"},"status":{}}'
        },
        creationTimestamp: '2025-10-23T23:51:12Z',
        fields:            [
          'reg-xzgt47v',
          'reg-xz',
          'Complete',
          'AllImagesScanned',
          7,
          7,
          '18h'
        ],
        generateName:    'reg-xz',
        generation:      1,
        name:            'reg-xzgt47v',
        namespace:       'cattle-sbomscanner-system',
        ownerReferences: [
          {
            apiVersion:         'sbomscanner.kubewarden.io/v1alpha1',
            blockOwnerDeletion: true,
            controller:         true,
            kind:               'Registry',
            name:               'reg-xz',
            uid:                '813db1a7-1b19-4716-a8bc-1878115af45f'
          }
        ],
        relationships: [
          {
            fromId:   'cattle-sbomscanner-system/reg-xz',
            fromType: 'sbomscanner.kubewarden.io.registry',
            rel:      'owner',
            state:    'active',
            message:  'Resource is current'
          }
        ],
        resourceVersion: '163206351',
        state:           {
          error:         true,
          message:       'ScanJob completed successfully',
          name:          'error',
          transitioning: false
        },
        uid: '860666c3-c709-4af8-b3d7-35b748db2899'
      },
      spec:   { registry: 'reg-xz' },
      status: {
        completionTime: '2025-10-24T18:26:09Z',
        conditions:     [
          {
            error:              false,
            lastTransitionTime: '2025-10-23T23:51:13Z',
            lastUpdateTime:     '2025-10-23T23:51:13Z',
            message:            'ScanJob completed successfully',
            observedGeneration: 1,
            reason:             'Complete',
            status:             'False',
            transitioning:      false,
            type:               'Scheduled'
          },
          {
            error:              false,
            lastTransitionTime: '2025-10-23T23:52:15Z',
            lastUpdateTime:     '2025-10-23T23:52:15Z',
            message:            'ScanJob completed successfully',
            observedGeneration: 1,
            reason:             'Complete',
            status:             'False',
            transitioning:      false,
            type:               'InProgress'
          },
          {
            error:              false,
            lastTransitionTime: '2025-10-23T23:52:15Z',
            lastUpdateTime:     '2025-10-23T23:52:15Z',
            message:            'All images scanned successfully',
            observedGeneration: 1,
            reason:             'AllImagesScanned',
            status:             'True',
            transitioning:      false,
            type:               'Complete'
          },
          {
            error:              true,
            lastTransitionTime: '2025-10-23T23:51:12Z',
            lastUpdateTime:     '2025-10-23T23:51:12Z',
            message:            'ScanJob completed successfully',
            observedGeneration: 1,
            reason:             'Complete',
            status:             'False',
            transitioning:      false,
            type:               'Failed'
          }
        ],
        imagesCount:        7,
        scannedImagesCount: 7,
        startTime:          '2025-10-23T23:52:14Z'
      }
    }
  ]
};
