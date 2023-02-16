## Setup

```bash
# Download and setup
git clone https://github.com/kubewarden/ui.git
cd ui/tests/
npm install
npx playwright install

# Optionally create an alias
alias pw='npx playwright'
```

## Kubewarden Installation

```bash
# Requires RANCHER_URL variable:
export RANCHER_URL=https://172.31.0.2.nip.io/
pw test installation
```

## Howtos 

### Set up tracing

```bash
# ==================================================================================================
# Open Telemetry

helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm upgrade -i --wait my-opentelemetry-operator open-telemetry/opentelemetry-operator \
  --namespace open-telemetry --create-namespace

# ==================================================================================================
# Jaeger Tracing (can be installed from rancher)

app=jaeger pw test helpers -g 'appInstall'
kubectl patch apps.catalog.cattle.io -n jaeger jaeger-operator --type merge -p '
    { "spec": { "values": {
          "rbac": { "clusterRole": true },
          "jaeger": { "create": true }
    }}}'
app=jaeger pw test helpers -g 'appReload'


# ==================================================================================================
# enable telemetry & jaeger (controller & defaults)

kubectl patch apps.catalog.cattle.io -n cattle-kubewarden-system rancher-kubewarden-controller --type merge -p '
    {"spec": {"values": {"telemetry": {
        "enabled": true,
        "tracing": {"jaeger": {
            "endpoint": "jaeger-operator-jaeger-collector.jaeger.svc.cluster.local:14250",
            "tls": {"insecure": true}
    }}}}}}'

kubectl patch apps.catalog.cattle.io -n cattle-kubewarden-system rancher-kubewarden-defaults --type merge -p '
    {"spec": {"values": {"policyServer": {"telemetry": { "enabled": true }}}}}'

app=kubewarden pw test helpers -g 'appReload'
app=kubewarden-defaults pw test helpers -g 'appReload'

```
