import Axe from 'axe-core'
import { Browser, Frame, Page } from 'puppeteer-core'
import { runAxe } from './browser'

type AnalyzeCB = (err: Error | null, result?: Axe.AxeResults) => void

function arrayify<T>(src: T | T[]): T[] {
  if (!Array.isArray(src)) {
    return [src]
  }
  return src
}

function injectAxeModule(frame: Frame): Promise<any> {
  return frame.addScriptTag({
    path: 'node_modules/axe-core/axe.min.js'
  })
}
function injectAxeString(frame: Frame, source: string): Promise<any> {
  return frame.evaluate(source)
}
function injectAxe(
  frame: Frame,
  source?: string
): Array<Promise<any>> {
  const injections = frame
    .childFrames()
    .map(subFrame => injectAxe(subFrame, source))
    .reduce((acc, arr) => acc.concat(arr), [])

  let injectP: Promise<any>
  if (source === undefined) {
    injectP = injectAxeModule(frame)
  } else {
    injectP = injectAxeString(frame, source)
  }

  injections.push(injectP)
  return injections
}

function getFrame(pageFrame: Page | Frame): Frame {
  if ((pageFrame as Page).mainFrame) {
    return (pageFrame as Page).mainFrame()
  } else {
    return pageFrame as Frame
  }
}

// TBH this doesn't wait but instead just gives a nice error when it isn't ready.
async function waitForFrameReady(frame: Frame) {
  // Wait so that we know there is an execution context.
  // Assume that if we have an html node we have an execution context.
  await frame.waitForSelector('html')

  // Check if the page is loaded.
  const pageReady = await frame.evaluate(
    () => document.readyState === 'complete'
  )

  if (!pageReady) {
    throw new Error('Page is not ready')
  }
}

function normalizeContext(
  includes: string[][],
  excludes: string[][]
): Axe.ElementContext | null {
  if (!excludes.length && !includes.length) {
    return null
  }

  const ctx: Axe.ElementContext = {}
  if (excludes.length) {
    ctx.exclude = excludes
  }
  if (includes.length) {
    ctx.include = includes
  }

  return ctx
}

class AxeBuilderImpl {
  public _frame: Frame
  public _source?: string
  public _includes: string[][]
  public _excludes: string[][]
  public _options: Axe.RunOptions | null
  public _config: Axe.Spec | null

  constructor(pageFrame: Page | Frame, source?: string) {
    this._frame = getFrame(pageFrame)
    this._source = source
    this._includes = []
    this._excludes = []
    this._options = null
    this._config = null
  }

  public include(selector: string | string[]): this {
    selector = arrayify(selector)
    this._includes.push(selector)
    return this
  }

  public exclude(selector: string | string[]): this {
    selector = arrayify(selector)
    this._excludes.push(selector)
    return this
  }

  public options(options: Axe.RunOptions): this {
    this._options = options
    return this
  }

  public withRules(rules: string | string[]): this {
    rules = arrayify(rules)

    if (!this._options) {
      this._options = {}
    }

    this._options.runOnly = {
      type: 'rule',
      values: rules
    }

    return this
  }

  public withTags(tags: string | string[]): this {
    tags = arrayify(tags)

    if (!this._options) {
      this._options = {}
    }

    this._options.runOnly = {
      type: 'tag',
      values: tags
    }

    return this
  }

  public disableRules(rules: string | string[]): this {
    rules = arrayify(rules)

    if (!this._options) {
      this._options = {}
    }

    const newRules: any = {}
    for (const rule of rules) {
      newRules[rule] = {
        enabled: false
      }
    }
    this._options.rules = newRules

    return this
  }

  public configure(config: Axe.Spec): this {
    // Cast to any because we are asserting for javascript provided argument.
    if (typeof (config as any) !== 'object') {
      throw new Error(
        'AxeBuilder needs an object to configure. See axe-core configure API.'
      )
    }

    this._config = config
    return this
  }

  public async analyze(): Promise<Axe.AxeResults>
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<void>
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<Axe.AxeResults | void> {
    // Flag to use old-style api.
    const oldApi = callback && (callback as any).length === 1

    try {
      await waitForFrameReady(this._frame)

      const injections = injectAxe(this._frame, this._source)
      await Promise.all(injections)

      const context = normalizeContext(this._includes, this._excludes)
      const axeResults = await this._frame.evaluate(
        runAxe,
        this._config,
        context,
        this._options
      )

      if (callback) {
        if (oldApi) {
          callback(axeResults)
        } else {
          callback(null, axeResults)
        }
        return
      } else {
        return axeResults
      }
    } catch (err) {
      if (callback && !oldApi) {
        callback(err)
        return
      } else {
        throw err
      }
    }
  }
}

// Needs to be constructable with or without `new`, so this function enables
// that behavior.
function AxeBuilder(
  this: AxeBuilderImpl,
  page: Page | Frame,
  source?: string
): AxeBuilderImpl {
  if (!new.target) {
    return new AxeBuilderImpl(page, source)
  }

  const thisImpl = new AxeBuilderImpl(page, source)
  Object.assign(this, thisImpl)
  // To satisfy Typescript.
  return thisImpl
}
Object.setPrototypeOf(
  AxeBuilder,
  Object.getPrototypeOf(AxeBuilderImpl)
)

async function loadPage(
  browser: Browser,
  url: string,
  { opts, source }: { opts?: any; source?: string }
) {
  const page = await browser.newPage()
  await page.setBypassCSP(true)

  await page.goto(url, opts)

  return new AxeBuilderImpl(page.mainFrame(), source)
}
AxeBuilder.loadPage = loadPage

exports = module.exports = AxeBuilder
exports.default = AxeBuilder
