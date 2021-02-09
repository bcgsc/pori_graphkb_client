# Developers Guide

- [Install](#install)
- [Docker](#docker)
- [Tests](#tests)
  - [Running the Tests](#running-the-tests)
  - [Coverage Reports](#coverage-reports)
- [Style Guide](#style-guide)
  - [App Organization](#app-organization)
  - [Branch conventions](#branch-conventions)
  - [Coding Guidelines](#coding-guidelines)
- [Reading List](#reading-list)
- [Roadmap](#roadmap)

## Install

First clone the repository locally and checkout the development branch

```bash
git clone https://github.com/bcgsc/pori_graphkb_client.git
cd pori_graphkb_client
git checkout development
```

Next install the project dependencies using npm

```bash
npm install
```

Start the development server

```bash
npm start
```

## Docker

Building the Docker Image with the default HTTP URLs. The Image builds http by default, if you
need HTTPS you will need your own certs etc.

```bash
docker build --file Dockerfile --tag bcgsc/pori-graphkb-client:latest .
```

Now to start the static nginx server

```bash
docker run \
  -p 5000:80 \
  -d \
  -e API_BASE_URL='https://pori-demo.bcgsc.ca/graphkb-api' \
  -e KEYCLOAK_REALM=PORI \
  -e KEYCLOAK_URL='https://pori-demo.bcgsc.ca/auth' \
  -e PUBLIC_PATH=/graphkb \
  bcgsc/pori-graphkb-client:latest
```

## Tests

### Running the Tests

Unit tests are made using [Jest](https://jestjs.io/docs/en/getting-started.html) and [Enzyme](https://airbnb.io/enzyme/docs/api/).
In terminal before running any test commands:

The main test suite can be run using the test command

```bash
npm run test
```

### Coverage Reports

The files generated for jest coverage reports are stored in the `/coverage` directory:

```text
`-- coverage/
  |-- clover.xml                # clover report
  |-- junit.xml                 # junit-formatted report
  `-- lcov-report/**/*.html     # lcov-formatted reports for each file.
```

## Style Guide

### App Organization

```text
|-- config/
|-- docs/
`-- src
  |-- components/
  |-- services/
  |-- static/
  |-- views/
  |-- App.{js,scss}
  |-- index.{js,scss}
  `-- registerServiceWorker.js
```

| File or Directory             | Description                                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| config/                       | Contains webpack and jest configurations.                                                                                                                                                                                   |
| src/                          | Contains all code that is required for the app to run                                                                                                                                                                       |
| src/components/               | Contains general use app components, mostly presentational. Eg a special type of button with the GSC logo.                                                                                                                  |
| src/services/                 | Contains other business logic modules that are not `React` components. Eg a collection of math functions for calculating geometries for a special graph.                                                                    |
| src/static/                   | Contains static resources to be loaded into the page. Eg a tutorial video .mp4 file to be loaded into a help dialog.                                                                                                        |
| src/views/                    | Highest level `React` components to be served as root components of a certain URL. Interacts with the router and App context, and are placed in the `<Route />` components. Eg an "About us" page found at the URL "/about" |
| `src/views/<view>/components` | Single-use components specific to the view they are bundled with                                                                                                                                                            |
| src/App.[js, scss]            | `React` app root component                                                                                                                                                                                                  |
| src/index.[js, scss]          | `webpack` bundle root script, simply renders `React` app root component and registers service worker.                                                                                                                       |
| src/registerServiceWorker.js  | Registers the service worker created by webpack to serve cached views before re-requesting them to improve performance                                                                                                      |

### Branch conventions

All changes should be made into their own branch and merged with a pull request, preferably with a linked KBDEV ticket in at least one of the commits. KBDEV maintainers should make branches on this repository, otherwise fork the repository into your own personal BitBucket account, and then make a pull request from there.

Here are the naming conventions for the different types of branches used in this project.

| branch type                     | description                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| feature/[`feature name`]        | Branch for adding a new feature. Eg: `feature/stats-page`                                                   |
| release/[`version number(s)`]   | Branch for releases. Can specify ranges of patch versions with "X" Eg: `release/v0.6.X` or `release/v1.0.X` |
| bugfix/[`bug desc/ticket code`] | Branch for fixing bugs. Eg: `bugfix/KBDEV-1234` or `bugfix/query-crashing`                                  |
| ???                             | New branch conventions should be discussed with the KBDEV team                                              |

### Coding Guidelines

- When adding new files, choose the best directory for the contents.
- Read the [GSC New Developer Guidelines wiki page](https://www.bcgsc.ca/wiki/display/DEVSU/GeneralGuidelines+for+New+Developers)
- Lint everything. App will not compile if there are linting errors.
- JSDoc all functions, classes, and `propTypes` declarations.
- Follow `Material Design` when designing front end components.

## Reading List

For new devlopers joining the project, below are listed some important topics that should be covered before you start.

- [GraphKB API spec](https://graphkb-api.bcgsc.ca/api/spec)
- Schema specification can be found at the [GraphKB schema repo](https://github.com/bcgsc/pori_graphkb_schema)
- [ReactJS basics](https://reactjs.org/tutorial/tutorial.html)
- [React Routing](https://reacttraining.com/react-router/web/guides/quick-start) as well as [integrating a custom history object into your app](https://stackoverflow.com/questions/42701129/how-to-push-to-history-in-react-router-v4/45849608#45849608)
- [ReactJS Context](https://reactjs.org/docs/context.html), which is used for providing `schema` and `user` data throughout other components in the application.
- The testing technologies linked above.
- [SASS](https://sass-lang.com/)
- [GraphComponent] : [d3 force directed graph](https://github.com/d3/d3-force). The learning curve for d3 is higher than for the other technologies since integrating with React can be a hassle. Try to use the existing code here as reference as you go.

## Roadmap

The target user base of the Knowledgebase GUI is researchers and clinicians. As such, addressing their needs/concerns will be the #1 priority when developing. Larger features such as different data display formats, new pages, and large architecture overhauls must be discussed with other members of the KBDEV and VARDB team.

Requested features are kept track of in the [KBDEV JIRA space](https://www.bcgsc.ca/jira/secure/RapidBoard.jspa?rapidView=176&projectKey=KBDEV&view=planning.nodetail&quickFilter=707) using the [client component](https://www.bcgsc.ca/jira/browse/KBDEV-468?jql=project%20%3D%20KBDEV%20AND%20component%20%3D%20GUI)
