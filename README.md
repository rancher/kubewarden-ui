# Kubewarden UI

> Note the UI is still in development and has not yet been fully released

## Install

The first distribution of the UI will be alongside the Rancher Dashboard. Currently it's being built in a [forked repo](https://github.com/jordojordo/dashboard/tree/kubewarden), but is able to be tested with a [Docker image](https://hub.docker.com/repository/docker/jordonleach/kubewarden).

## Run Kubewarden UI

Run the latest [Docker image](https://hub.docker.com/repository/docker/jordonleach/kubewarden) with 1 environment variable:

- `CATTLE_UI_DASHBOARD_INDEX` - This must be set to ensure the dashboard is using the prebuilt dashboard with the Kubewarden branch. (e.g. `https://localhost/dashboard/index.html`)

For example:

```sh
docker run -d --name kubewarden \
  --restart=unless-stopped \
  --privileged \
  -p 80:80 -p 443:443 \
  -e CATTLE_UI_DASHBOARD_INDEX=https://localhost/dashboard/index.html \
  jordonleach/kubewarden:latest
```

## Add Kubewarden to Rancher

> Adapted from the [Kubewarden helm chart](https://charts.kubewarden.io/) install.

To add Kubewarden to Rancher you will need to install [`cert-manager`](https://cert-manager.io/docs/installation/), and then install the kubewarden-controller chart.

From your local cluster open the `kubectl` shell (ctrl+\`) and input:

```sh
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.5.3/cert-manager.yaml
helm repo add kubewarden https://charts.kubewarden.io
helm install --create-namespace -n kubewarden kubewarden-crds kubewarden/kubewarden-crds
helm install --wait -n kubewarden kubewarden-controller kubewarden/kubewarden-controller
```
