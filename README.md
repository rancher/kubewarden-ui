# Kubewarden UI

This is a plugin for the [Rancher Dashboard](https://github.com/rancher/dashboard) which allows you to interact with Kubewarden.

View the [Wiki](https://github.com/kubewarden/ui/wiki) for more in-depth info on how to use the UI. Visit the [Kubewarden docs](https://docs.kubewarden.io/introduction.html) for how Kubewarden works.

> _Note_: The UI is still in development and has not yet been fully released.

## Install

You will need to point the UI to a running instance of Rancher, here's a [quickstart guide](https://docs.ranchermanager.rancher.io/pages-for-subheaders/rancher-on-a-single-node-with-docker) for setting up Rancher in a Docker container.

> _Note_: Currently you will only be able to install and use the UI plugin while running a development environment locally. Also, the UI will not persist accross page refreshs, this is a limitation of the Rancher Plugin feature that is still under development. 

---

1. From the root directory, install the packages

```sh
yarn install
```

2. Build the plugin

```sh
yarn build-pkg kubewarden
```

3. In another terminal, serve the package

```sh
yarn serve-pkgs kubewarden
```

4. Run the dashboard locally

```sh
API=https://<rancher-host> yarn dev
```

Once your environment is running you will be able to load the plugin by navigating to the Plugins page from the Side Nav. Load the plugin by inputing the provided url from the `serve-pkgs` command, for instance: `http://127.0.0.1:4500/kubewarden-0.1.0/kubewarden-0.1.0.umd.min.js`.

Then you will be able to install the Kubewarden [helm chart](https://github.com/kubewarden/helm-charts/).

5. Add the Kubewarden helm chart repository ( `https://charts.kubewarden.io` ) to your list of repositories within Rancher

6. Install the `Kubewarden` chart, this includes the Kubewarden crds and the Kubewarden-controller.
