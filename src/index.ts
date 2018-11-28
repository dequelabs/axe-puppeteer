import * as Axe from 'axe-core'
import { Browser, Frame, Page } from 'puppeteer-core'
import { pageIsLoaded, runAxe } from './browser'

type AnalyzeCB = (err: Error | null, result?: Axe.AxeResults) => void

function arrayify<T>(src: T | T[]): T[] {
  if (!Array.isArray(src)) {
    return [src]
  }
  return src
}

function injectAxeModule(frame: Frame): Promise<void> {
  return frame.addScriptTag({
    path: require.resolve('axe-core')
  })
}

function injectAxeString(
  frame: Frame,
  source: string
): Promise<void> {
  return frame.evaluate(source)
}

function injectAxe(
  frame: Frame,
  source?: string
): Array<Promise<void>> {
  const injections = frame
    .childFrames()
    .map(subFrame => injectAxe(subFrame, source))
    .reduce((acc, arr) => acc.concat(arr), [])

  let injectP: Promise<void>
  if (!source) {
    injectP = injectAxeModule(frame)
  } else {
    injectP = injectAxeString(frame, source)
  }

  injections.push(injectP)
  return injections
}

function isPage(pageFrame: Page | Frame): pageFrame is Page {
  return (pageFrame as any).mainFrame !== undefined
}

function getFrame(pageFrame: Page | Frame): Frame {
  if (isPage(pageFrame)) {
    return pageFrame.mainFrame()
  } else {
    return pageFrame
  }
}

async function ensureFrameReady(frame: Frame) {
  // Wait so that we know there is an execution context.
  // Assume that if we have an html node we have an execution context.
  await frame.waitForSelector('html')

  // Check if the page is loaded.
  const pageReady = await frame.evaluate(pageIsLoaded)

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

export class AxePuppeteer {
  private _frame: Frame
  private _source?: string
  private _includes: string[][]
  private _excludes: string[][]
  private _options: Axe.RunOptions | null
  private _config: Axe.Spec | null

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
        'AxePuppeteer needs an object to configure. See axe-core configure API.'
      )
    }

    this._config = config
    return this
  }

  // TODO: Confirm that we don't have to resolve promise if given promise.
  // Axe-webdriverjs always resolves the promise but doesn't reject if given callback
  public async analyze(): Promise<Axe.AxeResults>
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<void>
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<Axe.AxeResults | void> {
    try {
      // TODO: Don't fail if non-top-level frames aren't loaded
      await ensureFrameReady(this._frame)

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
        callback(null, axeResults)
        return
      } else {
        return axeResults
      }
    } catch (err) {
      if (callback) {
        callback(err)
        return
      } else {
        throw err
      }
    }
  }
}

// TODO: Also close the page
export async function loadPage(
  browser: Browser,
  url: string,
  { opts, source }: { opts?: any; source?: string } = {}
) {
  const page = await browser.newPage()
  await page.setBypassCSP(true)

  await page.goto(url, opts)

  return new AxePuppeteer(page.mainFrame(), source)
}

export default AxePuppeteer
// CommonJS support
module.exports = AxePuppeteer
