# Kubewarden UI

> _Note_: The UI is still in development and has not yet been fully released.

## Install

The first release of the UI will be alongside the Rancher Dashboard. Currently it's being built in the [kubewarden](https://github.com/rancher/dashboard/tree/kubewarden) branch of `rancher/dashboard` and is able to be tested with a [package image](https://github.com/kubewarden/ui/pkgs/container/ui) in the `ghrc` for Kubewarden.

## Run the Rancher UI

Run the latest [package image](https://github.com/kubewarden/ui/pkgs/container/ui) with 1 environment variable:

- `CATTLE_UI_DASHBOARD_INDEX` - This must be set to ensure the dashboard is using the prebuilt dashboard with the Kubewarden branch. (e.g. `https://localhost/dashboard/index.html`)

For example:

```sh
docker run -d --name kubewarden \
  --restart=unless-stopped \
  --privileged \
  -p 80:80 -p 443:443 \
  -e CATTLE_UI_DASHBOARD_INDEX=https://localhost/dashboard/index.html \
  ghcr.io/kubewarden/ui:latest
```

---

## Add Kubewarden to Rancher

> Adapted from the [Kubewarden helm chart](https://charts.kubewarden.io/) install.

### **Kubewarden Prerequisites**

To add Kubewarden to Rancher you will need to install [`cert-manager`](https://cert-manager.io/docs/installation/).


Within your cluster open the `kubectl` shell (ctrl+\`) and input:

```sh
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.5.3/cert-manager.yaml
kubectl wait --for=condition=Available deployment --timeout=2m -n cert-manager --all
```

> If you wish to install metrics or tracing you will also need to install the `OpenTelemetry`

The OpenTelemetry Operator manages the automatic injection of the OpenTelemetry Collector sidecar inside of the PolicyServer pod. The Operator requires `cert-manager` to be installed inside of the cluster. Once `cert-manager` is up and running the Operator can be installed in this way:

```sh
kubectl apply -f https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml
kubectl wait --for=condition=Available deployment --timeout=2m -n opentelemetry-operator-system --all
```

### **Install Kubewarden**

There are two ways you can install Kubewarden into Rancher, through the UI or using Helm. Installing it through the UI will help down the line if you choose to install [metrics monitoring](#enabling-metrics) or tracing logging for your policies.

#### 1. Installing from the UI

- Within your cluster, navigate to Apps & Marketplace -> Repositories
- Create a new Repo with the type: `http` and the Index URL: `https://charts.kubewarden.io`
- Navigate to Apps & Marketplace -> Charts
- Filter for your new Repo and install the `kubewarden-crds` resource first
- After the `kubewarden-crds` resource has finished installing, navigate back to the Charts screen and install the `kubewarden-controller` resource

#### 2. Installing with Helm

- Open the `kubectl` shell for your cluster (ctrl+\`)
- Paste the following:

```sh
helm repo add kubewarden https://charts.kubewarden.io
helm install --create-namespace -n kubewarden kubewarden-crds kubewarden/kubewarden-crds
helm install --wait -n kubewarden kubewarden-controller kubewarden/kubewarden-controller
```
---

### Adding Cluster Admission Policies

Currently you will be unable to create [currated policies](https://hub.kubewarden.io/) from the UI. However, you can still install them with Yaml, either with `kubectl` or through the UI Create ClusterAdmissionPolicy page.

For instance, to install with `kubectl`:

```yml
kubectl apply -f - <<EOF
---
apiVersion: policies.kubewarden.io/v1alpha2
kind: ClusterAdmissionPolicy
metadata:
  name: privileged-pods
spec:
  policyServer: default
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.9
  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["pods"]
      operations:
        - CREATE
        - UPDATE
  mutating: false
EOF
```

To install with the UI:
1. Navigate to Kubewarden -> ClusterAdmissionPolicy
2. Choose Create in the top right
3. In `Step 1` select next at the bottom to bypass the currated list of policies
4. Input desired settings for policy and select `Finish`

After the installation of your policy is complete you will be able to view it from the ClusterAdmissionPolicy page.


---

## Enabling metrics

> _Note_: You will need a cluster with at least 4 cores to install the Monitoring tool.

Rancher has a Cluster Tool for Monitoring that uses Grafana and Prometheus. You can utilize this tool and integrate it with Kubewarden to view certain metrics pertaining to a given policy.

### **Metrics Prerequisites**

The OpenTelemetry Operator is necessary to manage the automatic injection of the OpenTelemetry Collector sidecar inside of the PolicyServer pod. This requires [`cert-manager`](https://cert-manager.io/docs/installation/) to be installed inside of the cluster, we covered both installations in a [previous step](#kubewarden-prerequisites).

### **Install Metrics**

#### 1. From the cluster explorer click on `Cluster Tools` in the side navigation
  - `Install` the Monitoring tool
  - Edit the YAML to include a Service Monitor for Kubewarden
  - You need to specify the correct namespace where you installed Kubewarden

> Adapted from [here](https://docs.kubewarden.io/operator-manual/telemetry/metrics/01-quickstart.html#install-prometheus)

```yml
prometheus:
  additionalPodMonitors: []
  additionalRulesForClusterRole: []
  additionalServiceMonitors:
    - name: kubewarden
      selector:
        matchLabels:
          app: kubewarden-policy-server-default
      namespaceSelector:
        matchNames:
          - kubewarden
      endpoints:
        - port: metrics
          interval: 10s
  annotations: {}
```

#### 2. Add the [ConfigMap](https://grafana.com/grafana/dashboards/15314)
  - Navigate to Storage -> ConfigMaps
  - Click `Create`
  - **Be sure to select the `cattle-dashboards` namespace**
  - Download the [JSON](https://grafana.com/api/dashboards/15314/revisions/1/download) for the Kubewarden Grafana dashboard
  - Choose `Read from File` and select the JSON file you downloaded
  - Add the necessary Annotations and Labels for Rancher monitoring, then `Create`

```yml
annotations:
  meta.helm.sh/release-name: rancher-monitoring
  meta.helm.sh/release-namespace: cattle-monitoring-system
labels:
  app: rancher-monitoring-grafana
  app.kubernetes.io/instance: rancher-monitoring
  app.kubernetes.io/managed-by: Helm
  app.kubernetes.io/part-of: rancher-monitoring
  app.kubernetes.io/version: 100.1.0_up19.0.3
  chart: rancher-monitoring-100.1.0_up19.0.3
  grafana_dashboard: "1"
  heritage: Helm
  release: rancher-monitoring
```

#### 3. Enable telemetry for your `kubewarden-controller` resource
  - Navigate to Apps & Marketplace -> Installed Apps
  - Select the `Edit/Upgrade` action for your `kubewarden-controller` resource
  - Edit the YAML for `telemetry` to be `enabled: "true"` and ensure the metrics port is correct

```yml
telemetry:
  enabled: True
policyServer:
    metrics:
      port: 8080
```

> _Note_: You may need to redeploy your Monitoring resources for the new ConfigMap to be loaded. You can easily do this from Workloads -> Deployments. Select all the resources in the `cattle-monitoring-system` namespace and click on the `Redeploy` action.

You should be able to view the metrics for any given ClusterAdmissionPolicy on the detail page for a given policy. You can also view the Kubewarden dashboard itself in the Grafana UI or the events from the Prometheus UI.

---

## Enabling Tracing

Tracing allows to collect fine grained details about policy evaluations. It can be a useful tool for debugging issues inside of your Kubewarden deployment and policies.

We will use [Jaeger](https://www.jaegertracing.io/) -- used to receive, store and visualize trace events.

### Install Jaeger

> Adapted from [here](https://docs.kubewarden.io/operator-manual/telemetry/tracing/01-quickstart.html)

We first need to add the helm repository that contains the [Jaeger Operator](https://github.com/jaegertracing/jaeger-operator) charts.

```sh
https://jaegertracing.github.io/helm-charts
```

You can add them with the UI as we did in [previous steps](#1-installing-from-the-ui) or with `kubectl`.

Install with `kubectl`:

```sh
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install --namespace jaeger --create-namespace jaeger-operator jaegertracing/jaeger-operator
```

Once the Jaeger Operator is installed you need to create a Jaeger resource, we will use the default [AllInOne](https://www.jaegertracing.io/docs/1.26/operator/#allinone-default-strategy) strategy:

```sh
kubectl apply -f - <<EOF
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: all-in-one
  namespace: jaeger
spec:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
EOF
```

> This strategy is meant to be used only for development, testing, and demo purposes

### Update `kubewarden-controller` with Jaeger endpoint

As we did in a [previous step](#3-enable-telemetry-for-your-kubewarden-controller-resource), you will need to edit your `kubewarden-controller` resource to add the Jaeger endpoint `all-in-one-collector.jaeger.svc.cluster.local:14250`.

For instance:

```yml
policyServer:
  telemetry:
    enabled: True
    tracing:
      jaeger:
        endpoint: "all-in-one-collector.jaeger.svc.cluster.local:14250"
```

The `all-in-one-collector` is the service we installed under the `jaeger` namespace. `cluster.local` is optional.

### Update OpenTelemetryCollectors

The last step is to update our OpenTelemetryCollector sidecar with the `tls` property to `insecure: true`.

1. Navigate to More Resources -> opentelemtry.io -> OpenTelemetryCollectors
2. Choose to edit the `kubewarden` sidecar
3. Add the `tls.insecure: true` property to `exporters.jaeger`

For instance:

```yml
exporters:
  jaeger:
    endpoint: all-in-one-collector.jaeger.svc.cluster.local:14250
    tls:
      insecure: true
```

4. Redeploy your Jaeger and OpenTelemetry resources to apply the new configuration

You should now be able to view any failed requests for any given policy's detail page. You can also view them from the Jaeger UI which will be at this endpoint:
`<cluster-ip>/api/v1/namespaces/jaeger/services/http:all-in-one-query:16686/proxy/` (granted you installed Jaeger into a namespace titled `jaeger`).
