# Kubewarden UI

View the [Wiki](https://github.com/kubewarden/ui/wiki) for more in-depth info on how to use the UI. Visit the [Kubewarden docs](https://docs.kubewarden.io/introduction.html) for how Kubewarden works.

> _Note_: The UI is still in development and has not yet been fully released.

## Install

The first release of the UI will be alongside the Rancher Dashboard. Currently it's being built in the [kubewarden](https://github.com/rancher/dashboard/tree/kubewarden) branch of `rancher/dashboard` and is able to be ran with a [package image](https://github.com/kubewarden/ui/pkgs/container/ui).

## Run the UI

Run the latest [package image](https://github.com/kubewarden/ui/pkgs/container/ui) with 1 environment variable:

- `CATTLE_UI_DASHBOARD_INDEX` - This must be set to ensure the dashboard is using the prebuilt dashboard with the Kubewarden branch. (e.g. `https://localhost/dashboard/index.html`)

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
kubectl apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml

kubectl wait --for=condition=Available deployment --timeout=2m -n cert-manager --all
```

> If you wish to install metrics or tracing you will also need to install the `OpenTelemetry`

The OpenTelemetry Operator manages the automatic injection of the OpenTelemetry Collector sidecar inside of the PolicyServer pod. The Operator requires `cert-manager` to be installed inside of the cluster. Once `cert-manager` is up and running the Operator can be installed in this way:

```sh
kubectl apply -f https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml

kubectl wait --for=condition=Available deployment --timeout=2m -n opentelemetry-operator-system --all
```

### **Install Kubewarden**

There are two ways you can install Kubewarden into Rancher, through the UI or using Helm. Installing it through the UI will help down the line if you choose to install [metrics monitoring](#enabling-metrics) or [tracing](#enabling-tracing) for your policies.

#### Option 1. Installing from the UI

- Within your cluster, navigate to Apps & Marketplace -> Repositories
- Create a new Repo with the type: `http` and the Index URL: `https://charts.kubewarden.io`
- Navigate to Apps & Marketplace -> Charts
- Filter for your new Repo and install the Kubewarden stack
  1. `kubewarden-crds`
  2. `kubewarden-controller`
  3. `kubewarden-defaults`

#### Option 2. Installing with Helm

- Open the `kubectl` shell for your cluster (ctrl+\`)
- The Kubewarden stack can be deployed with:

```sh
helm repo add kubewarden https://charts.kubewarden.io

helm install --wait -n kubewarden --create-namespace kubewarden-crds kubewarden/kubewarden-crds

helm install --wait -n kubewarden kubewarden-controller kubewarden/kubewarden-controller

helm install --wait -n kubewarden kubewarden-defaults kubewarden/kubewarden-defaults
```
---
