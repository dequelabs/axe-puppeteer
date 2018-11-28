import Axe from 'axe-core'
import { assert, expect } from 'chai'
import { Frame } from 'puppeteer'
import * as sinon from 'sinon'
import { AxePuppeteer, setupPuppeteer, setupServer } from './utils'

type SinonSpy = sinon.SinonSpy

const ExpectAssertionVal = (false as true) && expect(null)
type ExpectAssertion = typeof ExpectAssertionVal

async function expectAsync(
  fn: () => Promise<any>
): Promise<ExpectAssertion> {
  try {
    const res = await fn()
    return expect(() => res)
  } catch (err) {
    return expect(() => {
      throw err
    })
  }
}

async function expectAsyncToNotThrow(fn: () => Promise<any>) {
  const expectResult = await expectAsync(fn)
  // tslint:disable-next-line:no-unused-expression-chai
  expectResult.to.not.throw
}

describe('AxePuppeteer', function() {
  setupPuppeteer()
  setupServer()

  // TODO: Alternate constructor

  describe('constructor', function() {
    it('accepts a Page', async function() {
      await this.page.goto(this.fixtureFileURL('index.html'))
      const axePup = new AxePuppeteer(this.page)
      await expectAsyncToNotThrow(() => axePup.analyze())
    })

    it('accepts a Frame', async function() {
      await this.page.goto(this.fixtureFileURL('index.html'))
      const axePup = new AxePuppeteer(this.page.mainFrame())
      await expectAsyncToNotThrow(() => axePup.analyze())
    })

    it('accepts custom axe-core source', async function() {
      const axeSource = `
        window.axe = {
          run: () => new Promise(resolve => resolve({})),
          configure: () => {}
        }
      `

      await this.page.goto(this.fixtureFileURL('index.html'))

      const evalSpy: SinonSpy = sinon.spy(
        this.page.mainFrame(),
        'evaluate'
      )

      await new AxePuppeteer(this.page, axeSource).analyze()

      assert(evalSpy.calledWith(axeSource))
    })
    // TODO: Defaults to using the bundled axe-core source
  })

  it('injects into nexted frames', async function() {
    await this.page.goto(this.fixtureFileURL('nested-frames.html'))

    const spies = this.page
      .frames()
      .map((frame: Frame) => sinon.spy(frame, 'addScriptTag'))

    await new AxePuppeteer(this.page).analyze()

    const calledSpies = spies
      .map((spy: SinonSpy) => spy.called)
      .filter((called: boolean) => called)
    expect(calledSpies).to.have.lengthOf(4)
  })

  it('injects into nexted frames... when given a Frame', async function() {
    await this.page.goto(this.fixtureFileURL('nested-frames.html'))

    const spies = this.page
      .frames()
      .map((frame: Frame) => sinon.spy(frame, 'addScriptTag'))

    await new AxePuppeteer(this.page.mainFrame()).analyze()

    const calledSpies = spies
      .map((spy: SinonSpy) => spy.called)
      .filter((called: boolean) => called)
    expect(calledSpies).to.have.lengthOf(4)
  })

  // TODO: Disbale frames?

  // TODO: Returns results promise
  // TODO: Results callback

  it('lets axe-core errors bubble when using promise API', async function() {
    const axeSource = `
      window.axe = {
        run: () => Promise.reject(new Error('boom')),
        configure: () => {}
      }
    `

    await this.page.goto(this.fixtureFileURL('index.html'))

    const axePup = new AxePuppeteer(this.page, axeSource)
    ;(await expectAsync(async () => axePup.analyze())).to.throw(
      'boom'
    )
  })

  it('passes axe-core errors when using callback API', async function() {
    const axeSource = `
      window.axe = {
        run: () => Promise.reject(new Error('boom')),
        configure: () => {}
      }
    `

    await this.page.goto(this.fixtureFileURL('index.html'))

    await new AxePuppeteer(this.page, axeSource).analyze(
      (err, results) => {
        expect(err)
          .to.exist.and.be.instanceof(Error)
          .and.have.property('message')
          .that.includes('boom')
      }
    )
  })

  describe('context', function() {
    describe('with include and exclude', function() {
      it('passes both .include and .exclude', async function() {
        const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context === document) {
                return Promise.reject(new Error('Invalid context'))
              }
              if (context.include[0] !== '.include') {
                return Promise.reject(new Error('Invalid include context'))
              }

              if (context.exclude[0] !== '.exclude') {
                return Promise.reject(new Error('Invalid exclude context'))
              }

              return Promise.resolve({})
            }
          }
        `

        await this.page.goto(this.fixtureFileURL('context.html'))

        const axePip = new AxePuppeteer(this.page, axeSource)
          .include('.include')
          .exclude('.exclude')

        await expectAsyncToNotThrow(() => axePip.analyze())
      })
    })

    describe('with only include', function() {
      it('adds .include to context', async function() {
        const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context === document) {
                return Promise.reject(new Error('Invalid context'))
              }
              if (context.include[0] !== '.include') {
                return Promise.reject(new Error('Invalid include context'))
              }

              if (context.exclude) {
                return Promise.reject(new Error('Invalid exclude context'))
              }

              return Promise.resolve({})
            }
          }
        `

        await this.page.goto(this.fixtureFileURL('context.html'))

        const axePip = new AxePuppeteer(this.page, axeSource).include(
          '.include'
        )

        await expectAsyncToNotThrow(() => axePip.analyze())
      })
    })

    describe('with only exclude', function() {
      it('adds .exclude to context', async function() {
        const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context === document) {
                return Promise.reject(new Error('Invalid context'))
              }
              if (context.include) {
                return Promise.reject(new Error('Invalid include context'))
              }

              if (context.exclude[0] !== '.exclude') {
                return Promise.reject(new Error('Invalid exclude context'))
              }

              return Promise.resolve({})
            }
          }
        `

        await this.page.goto(this.fixtureFileURL('context.html'))

        const axePip = new AxePuppeteer(this.page, axeSource).exclude(
          '.exclude'
        )

        await expectAsyncToNotThrow(() => axePip.analyze())
      })
    })

    it('defaults to document', async function() {
      const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context !== document) {
                return Promise.reject(new Error('Invalid context'))
              }

              return Promise.resolve({})
            }
          }
        `

      await this.page.goto(this.fixtureFileURL('context.html'))

      const axePip = new AxePuppeteer(this.page, axeSource)

      await expectAsyncToNotThrow(() => axePip.analyze())
    })
  })

  describe('configure', function() {
    it('accepts custom configuration', async function() {
      const config: Axe.Spec = {
        checks: [
          {
            evaluate: () => false,
            id: 'foo'
          }
        ],
        rules: [
          {
            all: [],
            any: ['foo'],
            id: 'foo',
            none: [],
            selector: 'html',
            tags: ['wcag2aa']
          }
        ]
      }

      await this.page.goto(this.fixtureFileURL('index.html'))

      // HACK: work around axe-core (incorrectly) requiring this to be
      // a function (see https://github.com/dequelabs/axe-core/issues/974).
      ;(config.checks as any)[0].evaluate =
        'function () { return false }'

      const results = await new AxePuppeteer(this.page)
        .configure(config)
        .withRules(['foo'])
        .analyze()

      expect(results)
        .to.have.property('passes')
        .with.lengthOf(0)
      expect(results)
        .to.have.property('incomplete')
        .with.lengthOf(0)
      expect(results)
        .to.have.property('inapplicable')
        .with.lengthOf(0)
      expect(results)
        .to.have.property('violations')
        .with.lengthOf(1)
      expect(results.violations[0]).to.have.property('id', 'foo')
    })
  })

  describe('options', function() {
    it('passes options to axe-core', async function() {
      await this.page.goto(this.fixtureFileURL('index.html'))

      const results = await new AxePuppeteer(this.page)
        // Disable the `region` rule
        .options({ rules: { region: { enabled: false } } })
        .analyze()

      const flatResults = [
        ...results.passes,
        ...results.incomplete,
        ...results.inapplicable,
        ...results.violations
      ]

      expect(flatResults.find((r: Axe.Result) => r.id === 'region'))
        .to.be.undefined
    })
  })

  describe('withTags', function() {
    it('only rules with the given tag(s)', async function() {
      await this.page.goto(this.fixtureFileURL('index.html'))

      const results = await new AxePuppeteer(this.page)
        .withTags(['best-practice'])
        .analyze()

      const flatResults = [
        ...results.passes,
        ...results.incomplete,
        ...results.inapplicable,
        ...results.violations
      ]

      // Ensure all run rules had the 'best-practice' tag
      for (const rule of flatResults) {
        expect(rule.tags).to.include('best-practice')
      }
    })
  })

  describe('withRules', function() {
    it('only rules with the given rule(s)', async function() {
      await this.page.goto(this.fixtureFileURL('index.html'))

      const results = await new AxePuppeteer(this.page)
        // Only enable the `region` rule
        .withRules(['region'])
        .analyze()

      const flatResults = [
        ...results.passes,
        ...results.incomplete,
        ...results.inapplicable,
        ...results.violations
      ]

      expect(flatResults).to.have.lengthOf(1)
      expect(flatResults[0]).to.have.property('id', 'region')
    })
  })

  describe('disableRules', function() {
    it('disables the given rule(s)', async function() {
      await this.page.goto(this.fixtureFileURL('index.html'))

      const results = await new AxePuppeteer(this.page)
        // Disable the `region` rule
        .disableRules(['region'])
        .analyze()

      const flatResults = [
        ...results.passes,
        ...results.incomplete,
        ...results.inapplicable,
        ...results.violations
      ]

      expect(
        flatResults.find((r: Axe.Result) => r.id === 'region')
      ).to.be.undefined()
    })
  })
})
