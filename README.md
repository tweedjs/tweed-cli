# CLI for Tweed

## Installation

```shell
$ npm install --global tweed-cli
```

## Creating a new Tweed project
Without configuration, new projects will be installed with Webpack and Babel, and scripts
will be added to `package.json` for building for production (`npm run build`) and running
a development server (`npm run dev`).

Before doing anything, the CLI will ask if you're satisfied with the options, so you can
try different flags and options safely.

```shell
$ tweed new blog
? Here's what I got:

Project Name: blog
Directory:    ./blog
Bundler:      Webpack
Compiler:     Babel
Task Runner:  NPM scripts
Test Runner:  none
Linter:       none

Is this correct? (Y/n)
```

There are other options, though. You can turn stuff off:

```shell
$ tweed new blog \
  --bundler none \
  --compiler none \
  --task-runner none
? Here's what I got:

Project Name: blog
Directory:    ./blog
Bundler:      none
Compiler:     none
Task Runner:  none
Test Runner:  none
Linter:       none

Is this correct? (Y/n)
```

With this configuration, boilerplate will use ES5 JS and no tooling will be installed.

### TypeScript
Run `tweed new --compiler typescript` to install TypeScript tooling and use the language
for boilerplate.

### Running tasks with a Makefile
Run `tweed new --task-runner make` to put the scripts in a `Makefile` instead of NPM
scripts.

### Test Runners
Use `tweed new --test-runner jest|mocha` to install one of those test frameworkers, as
well as some boilerplate.

### Linters
Use `tweed new --linter standard` to install a linter for Standard JS.

## Generating components
Use `tweed generate` to create new components quickly.

```shell
$ tweed generate MyClass
Generated src/MyClass.js
```

The command will use hints from the environment to figure out if you're using TypeScript
or Babel. Otherwise it generates ES5 components.

You can add mutating fields to the components using the `--mutating` option.

```shell
$ tweed generate Counter --mutating count --mutating otherField -m thirdField
Generated src/Counter.js
```

If you're using TypeScript, you can provide the types of the fields by separating with a
colon:

```shell
$ tweed generate Counter --mutating count:number
Generated src/Counter.tsx
```

To simultaneously create directories, namespace the component with periods or slashes:

```shell
$ tweed generate pages.start.StartPage
Generated src/pages/start/StartPage.js

$ tweed generate data/Repository
Generated src/data/Repository.js
```

Add `--test` to generate a corresponding test case. Given that you have installed either
Jest or Mocha (e.g. `tweed new --test-runner jest`):

```shell
$ tweed generate pages.start.StartPage -t
Generated src/pages/start/StartPage.tsx
Generated __tests__/pages/start/StartPage.test.tsx
```
