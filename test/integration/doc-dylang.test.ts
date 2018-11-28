// Adapter from axe-webdriverjs.
// This test tests to make sure that a valid configuration works.

import { expect } from 'chai'
import {
  AxePuppeteer,
  customConfig,
  fixtureFilePath,
  fs,
  setupPuppeteer
} from '../utils'

describe('doc-dylang.html', function() {
  setupPuppeteer()

  it('should find violations with customized helpUrl', async function() {
    const file = fixtureFilePath('doc-dylang.html')
    const config = await customConfig()

    await this.page.goto(`file://${file}`)

    const results = await new AxePuppeteer(this.page)
      .configure(config)
      .withRules(['dylang'])
      .analyze()

    expect(results.violations).to.have.lengthOf(1)
    expect(results.violations[0].id).to.eql('dylang')
    expect(
      results.violations[0].helpUrl.indexOf(
        'application=axe-puppeteer'
      )
    ).to.not.eql(-1)
    expect(results.passes).to.have.lengthOf(0)
  })
})
