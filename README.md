[![Build & Release](https://github.com/rancher/kubewarden-ui/actions/workflows/build-extension-charts.yml/badge.svg)](https://github.com/rancher/kubewarden-ui/actions/workflows/build-extension-charts.yml)

[![E2E](https://github.com/rancher/kubewarden-ui/actions/workflows/playwright.yml/badge.svg?event=schedule)](https://github.com/rancher/kubewarden-ui/actions/workflows/playwright.yml?query=event%3Aschedule)
[![Unit tests](https://github.com/rancher/kubewarden-ui/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/rancher/kubewarden-ui/actions/workflows/unit-tests.yml)

# Kubewarden UI

This is an extension for [Rancher Manager](https://github.com/rancher/rancher) (`v2.7.0`) which allows you to interact with Kubewarden.

View the [Rancher UI Extension documentation](https://docs.kubewarden.io/next/howtos/ui-extension/install) for more in-depth info on how to use the UI. Visit the [Kubewarden docs](https://docs.kubewarden.io) for more insight on how to use Kubewarden.

## Installation

> This extension requires a Rancher version of `v2.7.0` or later, you can find the latest releases [here](https://github.com/rancher/rancher/releases).

The official [Rancher documentation](https://ranchermanager.docs.rancher.com/integrations-in-rancher/rancher-extensions#installing-extensions) has an extensive walkthrough on how to install an Extension. However, there are multiple ways of installing the Kubewarden Extension:

- Installing the Helm chart housed in the [Rancher Extension Repository](https://github.com/rancher/ui-plugin-charts) (Described in the [Rancher docs](https://ranchermanager.docs.rancher.com/integrations-in-rancher/rancher-extensions#installing-extensions))
- Installing the Helm chart within this repository (This method allows installing all Release Candidate builds)
- Deploying the Extension Catalog Image to mirror a Helm repository (Necessary for Air-Gapped clusters)

### Installing from the `Kubewarden/UI` repository

1. Navigate to the Extensions page from the side-nav and Enable the Extension support **without** adding the Rancher Extension Repository.
2. Once the Extension Operator has been installed click on the Action Menu in the top right of the screen and select "Manage Repositories".
3. Create a new Helm repository with the "Target" as a https URL pointing to the published domain for the UI Github Repository:

```console
https://rancher.github.io/kubewarden-ui/
```

4. Navigate back to the extensions screen and a card for Kubewarden should appear with available options for versions to install.

### Deploying the Extension Catalog Image

> This requires a Rancher Manager version of `v2.7.5` or greater

The Extension Catalog Image (ECI) is comprised of a hardened [SLE BCI](https://registry.suse.com/bci/bci-base-15sp4/index.html) image running an NGINX service which supplies the Helm charts as well as the minified extension files.More information can be found [here](https://rancher.github.io/dashboard/extensions/advanced/air-gapped-environments).

Released ECIs for Kubewarden can be found within the [packages](https://github.com/kubewarden/ui/pkgs/container/kubewarden-ui) of the UI repository. You will be able to deploy the ECI either from `ghcr.io` (e.g. `ghcr.io/kubewarden/kubewarden-ui:1.1.0`) or by mirroring the image into a registry that is accessible to the Rancher cluster.

#### Mirror the ECI into a Private Registry

1. Pull the image.

```console
docker pull ghcr.io/kubewarden/kubewarden-ui:1.1.0
```

2. Tag the image with the registry name

```console
docker tag ghcr.io/kubewarden/kubewarden-ui:1.1.0 my-registry.com/kubewarden/kubewarden-ui:1.1.0
```

3. Push the image to the registry

```console
docker push my-registry.com/kubewarden/kubewarden-ui:1.1.0
```

#### Deploy the ECI from the UI:

> Any Authentication needed for the registry **_MUST_** be created as a secret under the `cattle-ui-plugin-system` namespace.

1. Navigate to the Extensions page from the side-nav and Enable the Extension.
2. Once the Extension Operator has been installed click on the Action Menu in the top right of the screen and select "Manage Extension Catalogs".
3. Click on the "Import Extension Catalog" button to open the dialog.
4. Input the ECI reference including the version number into the "Catalog Image Reference" input.
5. Select any "Pull Secrets" necessary for the ECI to be pulled.
6. Once imported navigate back to the main Extensions and install Kubewarden extension as normal.

A more in-depth guide on importing an Extension Catalog Image can be found in the [Rancher Dashboard documentation](https://rancher.github.io/dashboard/extensions/advanced/air-gapped-environments#importing-the-extension-catalog-image).

## Developing

You will need to point the UI to a running instance of Rancher, here's a [quickstart guide](https://docs.ranchermanager.rancher.io/pages-for-subheaders/rancher-on-a-single-node-with-docker) for setting up Rancher in a Docker container.

### Run the dev environment

1. From the root directory, install the packages.

```sh
yarn install
```

2. Run the dashboard locally.

```sh
API=https://<rancher-host> yarn dev
```

### To test the build

1. Build the plugin.

```sh
yarn build-pkg kubewarden
```

3. In another terminal, serve the package.

```sh
yarn serve-pkgs kubewarden
```

4. Run the dashboard locally.

```sh
API=https://<rancher-host> yarn dev
```

Once your environment is running you will be able to load the plugin by navigating to the Extensions page from the Side Nav.

5. Load the plugin by choosing the "Developer Load" option from the Action Menu (3 dots), then inputing the provided url from the `serve-pkgs` command into the Extension URL input.
