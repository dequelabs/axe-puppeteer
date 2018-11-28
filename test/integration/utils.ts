import { Context } from 'mocha'
import * as path from 'path'
import Puppeteer from 'puppeteer'
import AxePuppeteer from '../../src/index'

export { AxePuppeteer, Puppeteer }

export interface ITestFunc extends Context {
  page: Puppeteer.Page
}

export function fixtureFilePath(filename: string): string {
  return path.resolve(__dirname, '../fixtures', filename)
}

export async function openBrowser(this: Context) {
  this.browser = await Puppeteer.launch()
}

export async function closeBrowser(this: Context) {
  await this.browser.close()
}

export async function openPage(this: Context) {
  this.page = await this.browser.newPage()
}

export async function closePage(this: Context) {
  await this.page.close()
}

export function setupPuppeteer() {
  before(openBrowser)
  after(closeBrowser)
  beforeEach(openPage)
  afterEach(closePage)
}
