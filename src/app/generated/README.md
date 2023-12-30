# OneCX portal core

This is a monorepo containing all core UI parts of the OneCX portal suite.

## Structure

This project uses NX monorepo:

[Nx Documentation](https://nx.dev/angular)

[10-minute video showing all Nx features](https://nx.dev/getting-started/intro)

[Interactive Tutorial](https://nx.dev/tutorial/01-create-application)

![S=structure graph](nx-graph.png)

### portal-integration-angular

Publishable integration lib for Angular projects

## Getting started

To run the suite locally, you'll need to launch the required backend & auth services first. You can do that for example by cloning [tkit-dev-env](https://gitlab.com/1000kit/demo-workshop/tkit-dev-env) and running `docker-compose up -d traefik tkit-portal-server keycloak-app apm ahm`. Check the [README.md](https://gitlab.com/1000kit/demo-workshop/tkit-dev-env/-/blob/master/README.md) for more information.

- use correct node and npm version: `nvm use`
- install dependencies: `npm i`
- start the shell: `nx run portal-mf-shell:serve`
- start welcome page portlet: `nx run portal-welcome:serve`
- run any of the microfrontends you need (e.g. `nx run theme-mgmt:serve`) and import their permissions to APM service (e.g. `npx nx run theme-mgmt:apm-sync`)
- open your browser on [http://localhost:4300/admin](http://localhost:4300/admin) and login as `onecx`/`onecx` user
- use `npx nx format:check --verbose=true --base develop` to format code before committing

## Docs

Run docs locally using `npx nx serve docs`

## Storybook

Publishable component libraries use storybook for documentation. To start it locally run:

```
nx run portal-integration-angular:storybook
```

## Building

You can build any service locally using standard NX commands e.g. `npx nx run <project>:<target>` or run some target on all affect projects using `npx nx affected`. The CI pipeline in the project will run build, lint and publish stages by default.

For apps/microfrontends we build dockerimage and helm chart as release artifacts. You can run the corresponding tasks locally using `npx nx run <project>:docker --push` and `npx nx run <project>:helm`.

## Other tasks

### Sync permissions with APM

Each app defines its permissions in a form CSV file (matrix of permission x role). These permissions are then bundled with the app will be rendered as k8s config map in runtime. Locally we dont use Helm/K8s therefore you need to manually push these permissions to APM service. If you use tkit-dev-env setup then we there is a custom nx target defined for this purpose:

```
npx nx run <you-app-name>:apm-sync
```

See `libs/build-plugin/src/executors/permission-sync` for more info.

## Publishing libs & services

### Publishing `@onecx/portal-integration-angular` package

To publish the `@onecx/portal-integration-angular` library to our private npm registry hosted [on Gitlab](https://gitlab.com/1000kit/apps/tkit-portal/onecx-portal-core-ui/-/packages) you need to complete the following steps:

1. Build the library: `npx nx run portal-integration-angular:build`
2. Copy credentials to the output folder: `cp tools/.npmrc_WRITE dist/libs/portal-integration-angular/.npmrc`
3. Publish the library: `cd dist/libs/portal-integration-angular && npm publish`

### Publishing `@onecx/portal-layout-styles` package

To publish the `@onecx/portal-layout-styles` library to our private npm registry hosted [on Gitlab](https://gitlab.com/1000kit/apps/tkit-portal/onecx-portal-core-ui/-/packages) you need to complete the following steps:

1. Build the library: `npx nx run portal-layout-styles:build`
2. Copy credentials to the output folder: `cp tools/.npmrc_WRITE dist/libs/portal-layout-styles/.npmrc`
3. Publish the library: `cd dist/libs/portal-layout-styles && npm publish`

## Development

The project uses conventional commits.

## Known issue

### Tests

... are missing or failing - should be provided.

### Husky

If you experience problems on commit whith hooks, make sure the husky is a `nvm` [aware](https://github.com/typicode/husky/issues/77#issuecomment-630065185)
