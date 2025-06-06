## [Extension test matrix](https://github.com/rancher/kubewarden-ui/blob/main/.github/workflows/playwright.yml)

| Trigger            	| Rancher    	| Mode    	| UI Ext 	| K3S  	| Notes                            	| Status 	|
|--------------------	|------------	|---------	|--------	|------	|----------------------------------	|:------:	|
| nightly (schedule) 	| 2.8 (p)    	| manual   	| prime  	| 1.28 	|                                  	| [![E2E](https://github.com/rancher/kubewarden-ui/actions/workflows/playwright.yml/badge.svg?event=schedule)](https://github.com/rancher/kubewarden-ui/actions/workflows/playwright.yml?query=event%3Aschedule) |
|                    	| 2.9 (p)    	| manual   	| prime  	| 1.30 	| install kubewarden from UI       	|  |
|                    	| 2.10 (p)    	| manual   	| prime  	| 1.31 	| install kubewarden from UI       	|  |
|                    	| 2.11 (p)    	| manual 	| prime  	| 1.32 	| upgrade path of kubewarden stack 	|  |
|                    	| 2.11 (p)    	| fleet   	| prime  	| 1.32 	| install kubewarden by fleet      	|  |
|                    	| 2.11 (p)    	| upgrade  	| prime  	| 1.32 	| install kubewarden by fleet      	|  |
| release (tag)      	| ^          	| ^       	| github 	| ^    	| same matrix as nightly job       	| [![E2E](https://github.com/rancher/kubewarden-ui/actions/workflows/playwright.yml/badge.svg?event=workflow_run)](https://github.com/rancher/kubewarden-ui/actions/workflows/playwright.yml?query=event%3Aworkflow_run) |
| pull request       	| latest (c) 	| manual   	| source 	| 1.30 	|                                  	|  |
| manual             	| any        	| any      	| any    	| any  	|                                  	|  |

## Setup

```bash
# Download and setup
git clone https://github.com/kubewarden/ui.git
cd ui/tests/
npm install
npx playwright install

# Upgrade
yarn upgrade @playwright/test --latest
yarn playwright install chromium

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
MODE=[manual|upgrade|fleet] ORIGIN=[source|github|prime] pw test --ui -x

# Install old kubewarden and upgrade it before tests
MODE=upgrade pw test --ui -x

# Install kubewarden by Fleet, not compatible with UPGRADE=1
MODE=fleet pw test --ui -x
```

## Howtos

### When UI tests fail in github

- Download playwright-report from action summary
- Extract and load zip file from `playwright-report/data/` into https://trace.playwright.dev/

