import { Spec } from 'axe-core'
import express from 'express'
import * as fsOrig from 'fs'
import { createServer, Server } from 'http'
import { Context } from 'mocha'
import * as path from 'path'
import Puppeteer from 'puppeteer'
import testListen from 'test-listen'
import { promisify } from 'util'
import AxePuppeteer, { loadPage } from '../src/index'

export const fs = {
  readFile: promisify(fsOrig.readFile)
}

export { AxePuppeteer, Puppeteer, loadPage }

export interface ITestFunc extends Context {
  page: Puppeteer.Page
}

export function fixtureFilePath(filename: string): string {
  return path.resolve(__dirname, 'fixtures', filename)
}

export async function customConfig() {
  const configFile = fixtureFilePath('custom-rule-config.json')
  const config = JSON.parse(
    await fs.readFile(configFile, 'utf8')
  ) as Spec
  return config
}

export async function openBrowser(this: Context) {
  this.browser = await Puppeteer.launch()
}

export async function closeBrowser(this: Context) {
  await this.browser.close()
}

async function openPage(this: Context) {
  this.page = await this.browser.newPage()
}

async function closePage(this: Context) {
  await this.page.close()
}

export function setupPuppeteer() {
  before(openBrowser)
  after(closeBrowser)
  beforeEach(openPage)
  afterEach(closePage)
}

async function startServer(this: Context) {
  // const app: express.Application = express()
  const app: express.Application = express()
  app.use(express.static(path.resolve(__dirname, 'fixtures')))
  this.server = createServer(app)
  this.addr = await testListen(this.server)

  this.fixtureFileURL = (filename: string): string => {
    return `${this.addr}/${filename}`
  }
}

function closeServer(this: Context) {
  this.server.close()
}

export function setupServer() {
  before(startServer)
  after(closeServer)
}
