# flow-brunch [![Build Status](https://travis-ci.org/michaelhogg/flow-brunch.svg?branch=master)](https://travis-ci.org/michaelhogg/flow-brunch)

Adds [Flow](https://flowtype.org) support to [Brunch](http://brunch.io).

* [Installation](#installation)
* [Overview](#overview)
  * [`status` method (default)](#status-method-default)
  * [`check-contents` method](#check-contents-method)
* [Optional configuration](#optional-configuration)
* [License](#license)


## Installation

Install the plugin:

```bash
npm install --save-dev flow-brunch
```

Ensure you have a [`.flowconfig`](https://flowtype.org/docs/advanced-configuration.html#flowconfig)
file in the root directory of your Brunch project:

```bash
touch .flowconfig
```

If you haven't already, you'll need to configure Brunch to
[strip Flow annotations](https://flowtype.org/docs/running.html).  For example:

```bash
npm install --save-dev babel-brunch
npm install --save-dev babel-plugin-transform-flow-strip-types

echo '{ "plugins": ["transform-flow-strip-types"] }' > .babelrc
```


## Overview

Brunch's [linting API](http://brunch.io/docs/plugins#method-lint-file-promise-ok-error-) is designed for linters like
[ESLint](http://eslint.org/) which operate on individual files in isolation, but Flow is designed to operate on a
complete codebase and check the interconnections between all the files.

To work around this issue, this plugin provides a choice of two different methods for executing Flow, each of which
has advantages and disadvantages:

|                      | `status` (default)                                                                                                                                                                  | `check-contents`                                                                                                       |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| :information_source: | Executes `flow status` to ask the Flow server for the current errors for the complete codebase, and then applies a filter to only report the errors relating to the specified file. | Executes `flow check-contents` to manually check the specified file and its dependencies.                              |
| :white_check_mark:   | Errors in all files interconnected with the specified file are detected and reported.                                                                                               | There's no race condition, so no pre-lint delay needs to be applied.                                                   |
| :x:                  | The existence of a race condition requires a pre-lint delay to be applied, which increases the execution time of the plugin (see [below](#status-method-default)).                  | Errors in files which depend on the specified file are not detected or reported (see [below](#check-contents-method)). |

### `status` method (default)

When [`brunch watch`](http://brunch.io/docs/commands#-brunch-watch-brunch-w-) is running, modifying a source file
initiates a [race condition](https://en.wikipedia.org/wiki/Race_condition#Software) between
[Brunch's build pipeline](http://brunch.io/docs/plugins#pipeline) and the
[Flow server](https://flowtype.org/docs/new-project.html#using-the-flow-server).  If Flow loses the race (ie: if the
Brunch build pipeline executes this plugin before Flow has finished rechecking the file), then any new errors won't be
reported.

:warning:  To avoid this issue, the plugin needs to apply a pre-lint delay to ensure Flow always wins the race.  This increases the
execution time of the plugin, which goes against [Brunch's philosophy](http://brunch.io/docs/why-brunch#philosophy-behind-brunch) of
[the paramount importance of speed](https://github.com/brunch/brunch-guide/blob/42a4627/content/en/chapter01-whats-brunch.md#the-paramount-importance-of-speed).

The default delay is 250 milliseconds.  If you observe Flow losing the race, then increase the delay in the
[configuration](#optional-configuration).

### `check-contents` method

Consider these two example files:

**foo.js**

```js
// @flow

const bar = require('./bar.js');

bar('test');
```

**bar.js**

```js
// @flow

module.exports = function (x: string) {
    console.log(x);
};
```

If [`brunch watch`](http://brunch.io/docs/commands#-brunch-watch-brunch-w-) is started, and then `function (x: string)`
is modified to `function (x: number)` in **bar.js**:

```js
// @flow

module.exports = function (x: number) {
    console.log(x);
};
```

then the plugin executes `flow check-contents` on **bar.js**.

:warning:  However, **foo.js** is not rechecked, because `flow check-contents` doesn't check any files which depend on
**bar.js**, and so the new error of calling `bar('test')` in **foo.js** (with a `string` instead of a `number`) won't be
detected or reported.


## Optional configuration

Place the following code within the [`plugins`](http://brunch.io/docs/config.html#-plugins-) section of your
[`brunch-config.js`](http://brunch.io/docs/config.html) file:

```js
flowtype: {
    warnOnly:    false,
    method:      "status",
    statusDelay: 250
}
```

All configuration items are optional.

| Config        | Type    | Default    | Description                                                                                                                                                                                           |
|---------------|---------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `warnOnly`    | Boolean | `false`    | If `true`, then linting issues will be reported as warnings instead of errors, allowing [Brunch's build pipeline](http://brunch.io/docs/plugins#pipeline) to continue compiling the affected file(s). |
| `method`      | String  | `"status"` | Method for executing Flow (either `"status"` or `"check-contents"`) – see [here](#overview).                                                                                                          |
| `statusDelay` | Number  | `250`      | Pre-lint delay (in milliseconds) for the `"status"` method – see [here](#status-method-default).                                                                                                      |


## License

Licensed under the [MIT license](LICENSE).
