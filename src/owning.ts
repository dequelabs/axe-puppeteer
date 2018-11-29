import * as Axe from 'axe-core'
import { Browser, Page } from 'puppeteer-core'
import { AxePuppeteer, AnalyzeCB } from './axePup'

// An instance of AxePuppeteer that owns a page and thus closes it after running axe.
class OwningAxePuppeteer extends AxePuppeteer {
  private page: Page

  constructor(page: Page, source?: string) {
    super(page, source)
    this.page = page
  }

  public async analyze(): Promise<Axe.AxeResults>
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<void>
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<Axe.AxeResults | void> {
    try {
      return await super.analyze(callback)
    } finally {
      await this.page.close()
    }
  }
}

export async function loadPage(
  browser: Browser,
  url: string,
  { opts, source }: { opts?: any; source?: string } = {}
) {
  const page = await browser.newPage()
  await page.setBypassCSP(true)

  await page.goto(url, opts)

  return new OwningAxePuppeteer(page, source)
}
