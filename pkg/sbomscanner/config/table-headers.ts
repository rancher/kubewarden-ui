export const REGISTRY_SCAN_TABLE = [
  {
    name:      'registry',
    labelKey:  'imageScanner.registries.registrytable.header.registry',
    value:     'metadata.name',
    sort:      'metadata.name',
    formatter: 'RegistryNameCell',
  },
  {
    name:     'namespace',
    labelKey: 'imageScanner.registries.registrytable.header.namespace',
    value:    'metadata.namespace',
    sort:     'metadata.namespace',
  },
  {
    name:     'uri',
    labelKey: 'imageScanner.registries.registrytable.header.uri',
    value:    'spec.uri',
    sort:     'spec.uri',
  },
  {
    name:     'repositories',
    labelKey: 'imageScanner.registries.registrytable.header.repos',
    value:    'spec.repositories',
    sort:     'spec.repositories',
  },
  {
    name:      'scanInterval',
    labelKey:  'imageScanner.registries.registrytable.header.schedule',
    value:     'spec.scanInterval',
    formatter: 'ScanInterval',
    sort:      'spec.scanInterval',
  },
  {
    name:      'status',
    labelKey:  'imageScanner.registries.registrytable.header.status',
    value:     'scanRec.currStatus',
    formatter: 'RegistryStatusCellBadge',
    sort:      'scanRec.currStatus',
    width:     100,
  },
  {
    name:      'progress',
    labelKey:  'imageScanner.registries.registrytable.header.progress',
    value:     'scanRec.progress',
    formatter: 'ProgressCell',
    sort:      'scanRec.progress',
    width:     120,
  },
  {
    name:      'previousScan',
    labelKey:  'imageScanner.registries.registrytable.header.prevScan',
    value:     'scanRec.previousScan',
    formatter: 'PreviousScanCell',
    sort:      'scanRec.previousScan',
    width:     200,
  },
];

export const REGISTRY_SCAN_HISTORY_TABLE = [
  {
    name:      'status',
    labelKey:  'imageScanner.registries.configuration.scanTable.header.status',
    value:     'statusResult.type',
    formatter: 'ScanHistoryStatusCell',
    sort:      'statusResult.type',
    width:     100,
  },
  {
    name:      'since',
    labelKey:  'imageScanner.registries.configuration.scanTable.header.since',
    value:     'statusResult.lastTransitionTime',
    formatter: 'ScanHistorySinceCell',
    sort:      'statusResult.lastTransitionTime:desc',
    width:     210,
  },
  {
    name:      'progress',
    labelKey:  'imageScanner.registries.configuration.scanTable.header.progress',
    value:     'statusResult.progress',
    formatter: 'Progress',
    sort:      'statusResult.progress',
    width:     70,
  },
  {
    name: 'imagesScanned',
    labelKey:
      'imageScanner.registries.configuration.scanTable.header.imagesScanned',
    value: 'status.scannedImagesCount',
    sort:  'status.scannedImagesCount',
    width: 120,
  },
  {
    name: 'imagesFound',
    labelKey:
      'imageScanner.registries.configuration.scanTable.header.imagesFound',
    value: 'status.imagesCount',
    sort:  'status.imagesCount',
    width: 120,
  },
  {
    name:      'errors',
    labelKey:  'imageScanner.registries.configuration.scanTable.header.error',
    value:     'status',
    formatter: 'ScanErrorCell',
  },
];

export const VEX_MANAGEMENT_TABLE = [
  {
    name:      '_status',
    labelKey:  'imageScanner.vexManagement.table.headers.status',
    value:     'spec.enabled',
    formatter: 'VexStatusCellBadge',
    sort:      'spec.enabled',
  },
  {
    name:      'name',
    labelKey:  'imageScanner.vexManagement.table.headers.name',
    value:     'metadata.name',
    formatter: 'VexNameLink',
    sort:      'metadata.name',
  },
  {
    name:      'uri',
    labelKey:  'imageScanner.vexManagement.table.headers.uri',
    value:     'spec.url',
    formatter: 'UriExternalLink',
    sort:      'spec.url',
  },
  {
    name:     'createdBy',
    labelKey: 'imageScanner.vexManagement.table.headers.createdBy',
    value:    (row: any) => {
      const gen = Number(row?.metadata?.generation);

      return gen === 1 ? 'Rancher' : 'Manual entry';
    },
    sort: 'metadata.generation',
  },
  {
    name:      'updated',
    labelKey:  'imageScanner.vexManagement.table.headers.updated',
    value:     (row: any) => row?.metadata?.creationTimestamp || '',
    formatter: 'VexDateFormatter',
    sort:      'metadata.creationTimestamp',
  },
];

export const IMAGE_LIST_TABLE = [
  {
    name:      'name',
    labelKey:  'imageScanner.images.listTable.headers.imageName',
    value:     'imageReference',
    formatter: 'ImageNameCell',
    sort:      'imageReference',
    width:     200,
  },
  {
    name:      'cves',
    labelKey:  'imageScanner.images.listTable.headers.identifiedCVEs',
    value:     'report.summary',
    formatter: 'IdentifiedCVEsCell',
    sort:      [
      'report.summary.critical',
      'report.summary.high',
      'report.summary.medium',
      'report.summary.low',
      'report.summary.unknown',
    ],
    width: 300,
  },
  {
    name:      'imageId',
    labelKey:  'imageScanner.images.listTable.headers.imageId',
    formatter: 'ImageIdCell',
    value:     'imageMetadata.digest',
    sort:      'imageMetadata.digest',
  },
  {
    name:      'registry',
    labelKey:  'imageScanner.images.listTable.headers.registry',
    value:     'imageMetadata.registry',
    formatter: 'RegistryCellLink',
    sort:      ['metadata.namespace','imageMetadata.registry'],
  },{
    name:     'repository',
    labelKey: 'imageScanner.images.listTable.headers.repository',
    value:    'imageMetadata.repository',
    sort:     'imageMetadata.repository',
  },
  {
    name:     'platform',
    labelKey: 'imageScanner.images.listTable.headers.platform',
    value:    'imageMetadata.platform',
    sort:     'imageMetadata.platform',
  },
];

export const REPO_BASED_TABLE = [
  {
    name:     'repository',
    labelKey: 'imageScanner.images.listTable.headers.repository',
    value:    'repository',
    sort:     'repository',
    width:    300,
  },
  {
    name:      'cves',
    labelKey:  'imageScanner.images.listTable.headers.vulnerabilities',
    value:     'cveCntByRepo',
    formatter: 'IdentifiedCVEsPercentageCell',
    sort:      'cveCntByRepo',
    width:     300,
  },
  {
    name:      'registry',
    labelKey:  'imageScanner.images.listTable.headers.registry',
    value:     'registry',
    formatter: 'RegistryCellLink',
    sort:      'registry',
  },
];

export const REPO_BASED_IMAGE_LIST_TABLE = [
  {
    name:  '',
    value: '',
    width: 55,
  },
  {
    name:      'image',
    labelKey:  'imageScanner.images.listTable.headers.imageName',
    formatter: 'ImageNameCell',
    sort:      'imageReference',
    width:     300,
  },
  {
    name:      'cves',
    labelKey:  'imageScanner.images.listTable.headers.identifiedCVEs',
    value:     'scanResult',
    formatter: 'IdentifiedCVEsCell',
    sort:      'imageScanner',
    width:     300,
  },
  {
    name:     'platform',
    labelKey: 'imageScanner.images.listTable.headers.platform',
    value:    'imageMetadata.platform',
    sort:     'imageMetadata.platform',
    width:    200,
  },
  {
    name:      'imageId',
    labelKey:  'imageScanner.images.listTable.headers.imageId',
    formatter: 'ImageIdCell',
    value:     'imageMetadata.digest',
    sort:      'imageMetadata.digest',
    width:     100,
  },
  {
    name:  '',
    value: '',
  },
];

export const VULNERABILITIES_TABLE = [
  {
    name:      'cve',
    labelKey:  'imageScanner.vulnerabilities.table.headers.cve',
    value:     'metadata.name',
    formatter: 'CveNameLink',
    sort:      'metadata.name',
    width:     140,
  },
  {
    name:      'score',
    labelKey:  'imageScanner.vulnerabilities.table.headers.score',
    value:     'spec.scoreV3',
    formatter: 'ScoreBadgeCell',
    sort:      'spec.scoreV3',
    width:     100,
  },
  {
    name:            'affectedImages',
    labelKey:        'imageScanner.vulnerabilities.table.headers.affectedImages',
    value:           'spec.impactedImages_count',
    formatter:       'ImpactedCell',
    formatterParams: { ticks: 23 },
    sort:            'spec.impactedImages_count',
    width:           200,
  },
  {
    name:     'severity',
    labelKey: 'imageScanner.vulnerabilities.table.headers.severity',
    value:    'spec.severity',
    sort:     'spec.severity',
    width:    120,
  },
  {
    name:            'identifiedImages',
    labelKey:        'imageScanner.vulnerabilities.table.headers.identifiedImages',
    value:           'spec.identifiedImages_count',
    formatter:       'ImpactedCell',
    formatterParams: { ticks: 45 },
    sort:            'spec.identifiedImages_count',
    width:           300,
  },
];

export const VULNERABILITY_DETAILS_TABLE = [
  {
    name:      'cveId',
    labelKey:  'imageScanner.imageDetails.table.headers.cveId',
    value:     'cveId',
    formatter: 'CveNameLink',
    sort:      'cveId',
    width:     '16%',
  },
  {
    name:      'score',
    labelKey:  'imageScanner.imageDetails.table.headers.score',
    value:     'score',
    formatter: 'ScoreCell',
    sort:      ['scoreNum', 'severityNum'],
    width:     '12%',
  },
  {
    name:     'package',
    labelKey: 'imageScanner.imageDetails.table.headers.package',
    value:    'package',
    sort:     'package',
    width:    '12%',
  },
  {
    name:      'fixAvailable',
    labelKey:  'imageScanner.imageDetails.table.headers.fixAvailable',
    value:     'fixAvailable',
    formatter: 'FixAvailableCell',
    sort:      'fixAvailable',
    width:     '8%',
  },
  {
    name:      'severity',
    labelKey:  'imageScanner.imageDetails.table.headers.severity',
    value:     'severity',
    formatter: 'SeverityBadgeCell',
    sort:      'severity',
    width:     100,
  },
  {
    name:      'exploitability',
    labelKey:  'imageScanner.imageDetails.table.headers.exploitability',
    value:     'exploitability',
    formatter: 'ExploitabilityCell',
    sort:      'exploitability',
    width:     120,
  },
  {
    name:     'packageVersion',
    labelKey: 'imageScanner.imageDetails.table.headers.packageVersion',
    value:    'packageVersion',
    sort:     'packageVersion',
    width:    150,
  },
  {
    name:     'packagePath',
    labelKey: 'imageScanner.imageDetails.table.headers.packagePath',
    value:    'packagePath',
    sort:     'packagePath',
  },
];

export const VULNERABILITIES_DETAIL_IMAGE_LIST_TABLE = [
  {
    name:      'imageName',
    labelKey:  'imageScanner.vulnerabilities.details.table.headers.imageName',
    value:     'imageName',
    formatter: 'ImageNameCell',
    sort:      'imageName',
    width:     200,
  },
  {
    name:     'package',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.package',
    value:    'package',
    sort:     'package',
  },
  {
    name:     'status',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.status',
    value:    'status',
    sort:     'status',
  },
  {
    name:      'fixAvailable',
    labelKey:  'imageScanner.vulnerabilities.details.table.headers.fixVersion',
    formatter: 'FixAvailableCell',
    value:     'fixAvailable',
    sort:      'fixAvailable',
  },
  {
    name: 'packageVersion',
    labelKey:
      'imageScanner.vulnerabilities.details.table.headers.packageVersion',
    value: 'packageVersion',
    sort:  'packageVersion',
  },
  {
    name:     'packagePath',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.packagePath',
    value:    'packagePath',
    sort:     'packagePath',
  },
  {
    name:     'repository',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.repository',
    value:    'repository',
    sort:     'repository',
  },
];

export const VULNERABILITIES_DETAIL_GROUP_BY_REPOSITORY_TABLE = [
  {
    name:     'repository',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.repository',
    value:    'repository',
    sort:     'repository',
    width:    300,
  },
  {
    name:     'registry',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.registry',
    value:    'registry',
    sort:     'registry',
  },
];

export const VULNERABILITIES_DETAIL_SUB_IMAGES_TABLE = [
  {
    name:  '',
    value: '',
    sort:  '',
    width: 60,
  },
  {
    name:      'imageName',
    labelKey:  'imageScanner.vulnerabilities.details.table.headers.imageName',
    value:     'imageName',
    formatter: 'ImageNameCell',
    sort:      'imageName',
  },
  {
    name:     'package',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.package',
    value:    'package',
    sort:     'package',
  },
  {
    name:     'status',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.status',
    value:    'status',
    sort:     'status',
  },
  {
    name:      'fixAvailable',
    labelKey:  'imageScanner.vulnerabilities.details.table.headers.fixVersion',
    formatter: 'FixAvailableCell',
    value:     'fixAvailable',
    sort:      'fixAvailable',
  },
  {
    name: 'packageVersion',
    labelKey:
      'imageScanner.vulnerabilities.details.table.headers.packageVersion',
    value: 'packageVersion',
    sort:  'packageVersion',
  },
  {
    name:     'packagePath',
    labelKey: 'imageScanner.vulnerabilities.details.table.headers.packagePath',
    value:    'packagePath',
    sort:     'packagePath',
  },
];

export const LAYER_BASED_TABLE = [
  {
    name:     'layerId',
    labelKey: 'imageScanner.imageDetails.table.headers.layerId',
    value:    'layerId',
    sort:     'layerId',
    width:    500, // Increased width to accommodate decoded layer information
  },
  {
    name:      'vulnerabilities',
    labelKey:  'imageScanner.imageDetails.table.headers.vulnerabilities',
    value:     'vulnerabilities',
    formatter: 'IdentifiedCVEsCell',
    sort:      ['vulnerabilities.critical','vulnerabilities.high','vulnerabilities.medium','vulnerabilities.low','vulnerabilities.unknown'],
    width:     300,
  },
  {
    name:     'updated',
    labelKey: 'imageScanner.imageDetails.table.headers.updated',
    value:    'updated',
    sort:     'updated',
    width:    150,
  },
  // {
  //   name:     'size',
  //   labelKey: 'imageScanner.imageDetails.table.headers.size',
  //   value:    'size',
  //   sort:     'size',
  //   width:    120,
  // },
];
