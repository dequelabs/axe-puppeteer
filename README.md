# axe-puppeteer

[![Greenkeeper badge](https://badges.greenkeeper.io/dequelabs/axe-puppeteer.svg)](https://greenkeeper.io/)

[![Join the axe-core chat at https://gitter.im/dequelabs/axe-core](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dequelabs/axe-core?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Version](https://img.shields.io/npm/v/axe-puppeteer.svg)](https://www.npmjs.com/package/axe-puppeteer)
[![License](https://img.shields.io/npm/l/axe-puppeteer.svg)](LICENSE)
[![CircleCI Build](https://circleci.com/gh/dequelabs/axe-puppeteer/tree/master.svg?style=svg)](https://circleci.com/gh/dequelabs/axe-puppeteer/tree/master)

Provides a chainable axe API for Puppeteer and automatically injects into all frames.

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already. For running axe-puppeteer tests read more about [setting up your environment](CONTRIBUTING.md).

Install Puppeteer: `npm install puppeteer --no-save`

Install axe-puppeteer and its dependencies: `npm install axe-puppeteer`

## Usage

This module uses a chainable API to assist in injecting, configuring and analyzing
using axe with Puppeteer. As such, it is required to pass an instance of a Puppeteer `Page` or `Frame`.

Here is an example of a script that will drive Puppeteer to this repository,
perform analysis and then log results to the console.

TODO: CSP Bypass note

```javascript
const AxePuppeteer = require('axe-puppeteer');
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setBypassCSP(true);

await page.goto('https://dequeuniversity.com/demo/mars/');

const results = await new AxePuppeteer(page).analyze();
console.log(results);
```

### TODO: AxePuppeteer.loadPage

### AxePuppeteer(page: Frame | Page[, axeSource: string])

Constructor for the AxePuppeteer helper. 
You must pass an instance of a Puppeteer `Frame` or `Page` as the first argument.
Can be called with or without the `new` keyword.

TODO: CSP Bypass note

```javascript
const builder = new AxePuppeteer(page);
```

If you wish to run a specific version of axe-core, you can pass the source axe-core
source file in as a string.
Doing so will mean axe-puppeteer runs this version of axe-core, instead of
the one installed as a dependency of axe-puppeteer.

```javascript
const axeSource = fs.readFileSync('./axe-1.0.js', 'utf8');
const builder = new AxePuppeteer(page, axeSource);
```

### AxePuppeteer#include(selector: string | string[])

Adds a CSS selector to the list of elements to include in analysis

```javascript
new AxePuppeteer(page)
  .include('.results-panel');
```

### AxePuppeteer#exclude(selector: string | string[])

Add a CSS selector to the list of elements to exclude from analysis

```javascript
new AxePuppeteer(page)
  .include('.results-panel')
  .exclude('.results-panel h2');
```

### AxePuppeteer#options(options: Object)

Specifies options to be used by `axe.a11yCheck`.
**Will override any other configured options, including calls to `withRules` and `withTags`.**
See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md)
for information on its structure.

```javascript
new AxePuppeteer(page)
  .options({ checks: { 'valid-lang': ['orcish'] } });
```

### AxePuppeteer#withRules(rules: string | string[])

Limits analysis to only those with the specified rule IDs.
Accepts a String of a single rule ID or an Array of multiple rule IDs.
**Subsequent calls to `AxePuppeteer#options`, `AxePuppeteer#withRules` or `AxePuppeteer#withRules` will override specified options.**

```javascript
new AxePuppeteer(page)
  .withRules('html-lang');
```

```javascript
new AxePuppeteer(page)
  .withRules(['html-lang', 'image-alt']);
```

### AxePuppeteer#withTags(tags: string | string[])

Limits analysis to only those with the specified rule IDs.
Accepts a String of a single tag or an Array of multiple tags.
**Subsequent calls to `AxePuppeteer#options`, `AxePuppeteer#withRules` or `AxePuppeteer#withRules` will override specified options.**

```javascript
new AxePuppeteer(page)
  .withTags('wcag2a');
```

```javascript
new AxePuppeteer(page)
  .withTags(['wcag2a', 'wcag2aa']);
```

### AxePuppeteer#disableRules(rules: string | string[])

Skips verification of the rules provided. Accepts a String of a single rule ID or an Array of multiple rule IDs.
**Subsequent calls to `AxePuppeteer#options`, `AxePuppeteer#disableRules` will override specified options.**

```javascript
new AxePuppeteer(page)
  .disableRules('color-contrast');
```

or use it combined with some specified tags:

```javascript
new AxePuppeteer(page)
  .withTags(['wcag2a', 'wcag2aa'])
  .disableRules('color-contrast');
```

### AxePuppeteer#configure(config: Object)

Inject an axe configuration object to modify the ruleset before running Analyze.
Subsequent calls to this method will invalidate previous ones by calling `axe.configure`
and replacing the config object.
See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure)
for documentation on the object structure.

```javascript
const config = {
  checks: [Object],
  rules: [Object]
};
const results = await new AxePuppeteer(page)
  .configure(config)
  .analyze();
console.log(results);
```

### AxePuppeteer#analyze([callback: (Error | null[, Object]) => void])

Performs analysis and passes any encountered error and/or the result object to
the provided callback function or promise function.
**Does not chain as the operation is asynchronous**

Using the returned promise (optional):

```javascript
new AxePuppeteer(page)
  .analyze()
  .then(function(results) {
    console.log(results);
  })
  .catch(err => {
    // Handle error somehow
  });
```

Using a callback function

```javascript
new AxePuppeteer(page)
  .analyze(function(err, results) {
    if (err) {
      // Handle error somehow
    }
    console.log(results);
  });
```

## Examples

TODO

<!-- This project has a couple integrations that demonstrate the ability and use of this module: -->
<!--  -->
<!-- 1. [Running a single rule](test/integration/doc-lang.js) -->
<!-- 1. [Running against a page with frames](test/integration/frames.js) -->
<!-- 1. [SauceLabs example](test/sauce/sauce.js) -->

## Contributing

TODO

<!-- Read the [documentation on contributing](CONTRIBUTING.md) -->
