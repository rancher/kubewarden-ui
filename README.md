# Kubewarden UI

This is an extension for [Rancher Manager](https://github.com/rancher/rancher) (`v2.7.0`) which allows you to interact with Kubewarden.

View the [Rancher UI Extension documentation](https://docs.kubewarden.io/operator-manual/ui-extension/install) for more in-depth info on how to use the UI. Visit the [Kubewarden docs](https://docs.kubewarden.io) for more insight on how to use Kubewarden.

## Install

You will need to point the UI to a running instance of Rancher, here's a [quickstart guide](https://docs.ranchermanager.rancher.io/pages-for-subheaders/rancher-on-a-single-node-with-docker) for setting up Rancher in a Docker container.

> This extension requires a Rancher version of `v2.7.0` or later, you can find the latest releases [here](https://github.com/rancher/rancher/releases).

1. Navigate to the Extensions page from the side-nav and Enable the Extension support.
2. Once the Extension Operator has been installed you should see Kubewarden as an availble extension, click Install.

You will now have the Kubewarden Extension installed on your cluster.

3. Navigate to the Dashboard page by selecting the Kubewarden resource item and follow the steps to install the `Kubewarden` chart.

---

## Developing

To run a development environment you will need a working instance of Rancher to point the frontend towards. 

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
