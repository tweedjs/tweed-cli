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

Is this correct? (Y/n)
```

With this configuration, boilerplate will use ES5 JS and no tooling will be installed.

### TypeScript
Run `tweed new --compiler typescript` to use install TypeScript tooling and use the
language for boilerplate.

### Running tasks with a Makefile
Run `tweed new --task-runner make` to put the scripts in a `Makefile` instead of NPM
scripts.

### Test Runners
Use `tweed new --test-runner jest|mocha` to install one of those test frameworkers, as
well as some boilerplate.
