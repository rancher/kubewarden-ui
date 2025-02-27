import { V1Deployment } from '@kubernetes/client-node';

export default <V1Deployment>{
  id:    'cattle-kubewarden-system/rancher-kubewarden-controller',
  type:  'apps.deployment',
  links: {
    remove: 'https://localhost:8005/v1/apps.deployments/cattle-kubewarden-system/rancher-kubewarden-controller',
    self:   'https://localhost:8005/v1/apps.deployments/cattle-kubewarden-system/rancher-kubewarden-controller',
    update: 'https://localhost:8005/v1/apps.deployments/cattle-kubewarden-system/rancher-kubewarden-controller',
    view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-kubewarden-system/deployments/rancher-kubewarden-controller'
  },
  apiVersion: 'apps/v1',
  kind:       'Deployment',
  metadata:   {
    annotations: {
      'deployment.kubernetes.io/revision': '1',
      'meta.helm.sh/release-name':         'rancher-kubewarden-controller',
      'meta.helm.sh/release-namespace':    'cattle-kubewarden-system'
    },
    generation: 1,
    labels:     {
      'app.kubernetes.io/component':  'controller',
      'app.kubernetes.io/instance':   'rancher-kubewarden-controller',
      'app.kubernetes.io/managed-by': 'Helm',
      'app.kubernetes.io/name':       'kubewarden-controller',
      'app.kubernetes.io/part-of':    'kubewarden',
      'app.kubernetes.io/version':    'v1.21.0',
      'helm.sh/chart':                'kubewarden-controller-4.1.0'
    },
    name:      'rancher-kubewarden-controller',
    namespace: 'cattle-kubewarden-system',
  },
  spec: {
    progressDeadlineSeconds: 600,
    replicas:                1,
    revisionHistoryLimit:    10,
    selector:                {
      matchLabels: {
        'app.kubernetes.io/instance': 'rancher-kubewarden-controller',
        'app.kubernetes.io/name':     'kubewarden-controller'
      }
    },
    strategy: {
      rollingUpdate: {
        maxSurge:       '25%',
        maxUnavailable: '25%'
      },
      type: 'RollingUpdate'
    },
    template: {
      metadata: {
        labels: {
          'app.kubernetes.io/component':  'controller',
          'app.kubernetes.io/instance':   'rancher-kubewarden-controller',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'kubewarden-controller',
          'app.kubernetes.io/part-of':    'kubewarden',
          'app.kubernetes.io/version':    'v1.21.0',
          'helm.sh/chart':                'kubewarden-controller-4.1.0'
        }
      },
      spec: {
        containers: [
          {
            args: [
              '--leader-elect',
              '--deployments-namespace=cattle-kubewarden-system',
              '--webhook-service-name=rancher-kubewarden-controller-webhook-service',
              '--always-accept-admission-reviews-on-deployments-namespace',
              '--zap-log-level=info'
            ],
            command: [
              '/manager'
            ],
            image:           'ghcr.io/kubewarden/kubewarden-controller:v1.21.0',
            imagePullPolicy: 'IfNotPresent',
            livenessProbe:   {
              failureThreshold: 3,
              httpGet:          {
                path:   '/healthz',
                port:   8081,
                scheme: 'HTTP'
              },
              initialDelaySeconds: 15,
              periodSeconds:       20,
              successThreshold:    1,
              timeoutSeconds:      1
            },
            name:  'manager',
            ports: [
              {
                containerPort: 9443,
                name:          'webhook-server',
                protocol:      'TCP'
              }
            ],
            readinessProbe: {
              failureThreshold: 3,
              httpGet:          {
                path:   '/readyz',
                port:   8081,
                scheme: 'HTTP'
              },
              initialDelaySeconds: 5,
              periodSeconds:       10,
              successThreshold:    1,
              timeoutSeconds:      1
            },
            resources: {
              limits: {
                cpu:    '500m',
                memory: '200Mi'
              },
              requests: {
                cpu:    '250m',
                memory: '70Mi'
              }
            },
            securityContext:          { allowPrivilegeEscalation: false },
            terminationMessagePath:   '/dev/termination-log',
            terminationMessagePolicy: 'File',
            volumeMounts:             [
              {
                mountPath: '/tmp/k8s-webhook-server/serving-certs',
                name:      'cert',
                readOnly:  true
              }
            ]
          }
        ],
        dnsPolicy:                     'ClusterFirst',
        restartPolicy:                 'Always',
        schedulerName:                 'default-scheduler',
        securityContext:               { runAsNonRoot: true },
        serviceAccount:                'rancher-kubewarden-controller',
        serviceAccountName:            'rancher-kubewarden-controller',
        terminationGracePeriodSeconds: 10,
        volumes:                       [
          {
            name:   'cert',
            secret: {
              defaultMode: 420,
              secretName:  'kubewarden-webhook-server-cert'
            }
          }
        ]
      }
    }
  }
};
