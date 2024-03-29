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

## Run tests

Tests only require `RANCHER_URL` parameter.
This should be clean rancher if you want to run all the tests.

```bash
# Create cluster with rancher
docker run -d --restart=unless-stopped -p 80:80 -p 443:443 --privileged -e CATTLE_BOOTSTRAP_PASSWORD=sa rancher/rancher:latest

# Run tests
export RANCHER_URL=https://127.0.0.1.nip.io/
pw test --ui -x
```


## Parameters

ENV variables can be used to change behaviour

```bash
# Install UI extension from source, tag or official one
ORIGIN=[source|rc|released] pw test --ui -x

# Install old kubewarden and upgrade it before tests
UPGRADE=1 pw test --ui -x

# Install kubewarden by Fleet, not compatible with UPGRADE=1
FLEET=1 pw test --ui -x
```

## Howtos

### When UI tests fail in github

- Download playwright-report from action summary
- Extract and load zip file from `playwright-report/data/` into https://trace.playwright.dev/

