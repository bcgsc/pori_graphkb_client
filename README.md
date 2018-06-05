# Ontologyweb

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.0.

## Developers

After cloning, run `npm install` to install all dependencies. Then run `ng serve` to start the dev server (`http://localhost:4200/`). 

### Project structure

* Root Directory:

    * `node_modules `: Project dependencies.
    * `e2e`: End to end tests.
    * `src`: App source code.
    * `angular.json`: Angular configuration file.
    * `package.json`: Project dependencies configuration file.
    * `tsconfig.json`: Typescript configuration file.
    * `tslint.json`: Typescript linting configuration file.

* `src`:
    * `index.html`: Entry point to the app. Try not to change anything here.
    * `main.ts`: Compiles and bootstraps the app to be served to the browser.
    * `favicon.ico`: Browser tab icon for the app.
    * `karma.conf.js`: Karma configuration file.
    * `polyfills.ts`: Polyfills file for target browsers.
    * `styles.scss`: Global styles file.
    * `tests.ts`: Main entry point for tests. Try not to change anything here.
    * `tsconfig.{app|spec}.json`: Typescript compiler for app/tests.
    * `tslint.ts`: Additional linting info for running `ng lint`.
    * `assets`: Static resources for the app (pictures, files, etc.)
    * `environments`: Contains configuration info for different environments (could remove dummy services, master tokens, etc. from source code when deploying to production environment).
    * `app`: App Source code.

* `app`:
    * `app.module.ts`: Main module for the app. Configures imports and declarations for app.
    * `app.component.{html|ts|scss}`: Base app component. Best practice to not put too much business logic here.
    * `app-routing.module.ts`: Routing module for the app. Declare routes and corresponding component views.
    * `components`: Contains all app components. Each component is comprised of a .ts, .html, and .scss file corresponding to the view (html + scss) and controller (ts) of the component. By convention, components are named in the format `hyphenated-name/hyphenated-name.component.{html|ts|scss}`
    * `directives`: Contains custom directives for the app. Naming convention is `hyphenated-name.directive.ts`.
    * `models`: Contains model classes for the app.
    * `pipes`: Pipes can be used to dynamically format data in a view. Naming convention `hyphenated-name.pipe.ts`.
    * `services`: Services are meant to house business logic, and provide distinct functionalities to components that they are injected in.
    * `styles`: Additional style resources can be found here.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
