// Adapter from axe-webdriverjs.
// Ignores Typescript best practices due to that.
import { assert } from 'chai'
import { Frame } from 'puppeteer'
import Builder from '../src/index'

function newEmptyBuilder() {
  return new Builder({} as Frame)
}

function newEmptyPage() {
  return ('bob' as unknown) as Frame
}

describe('constructor', function() {
  it('should assign driver to this._frame', function() {
    assert.equal((new Builder(newEmptyPage()) as any)._frame, 'bob')
  })

  it('should define this._includes as an empty array', function() {
    const includes = (new Builder(newEmptyPage()) as any)._includes
    assert.isArray(includes)
    assert.lengthOf(includes, 0)
  })

  it('should define this._excludes as an empty array', function() {
    const excludes = (new Builder(newEmptyPage()) as any)._excludes
    assert.isArray(excludes)
    assert.lengthOf(excludes, 0)
  })

  it('should define this._options as null', function() {
    assert.isNull((newEmptyBuilder() as any)._options)
  })

  it('should define this._config as null', function() {
    assert.isNull((newEmptyBuilder() as any)._config)
  })
})

describe('include', function() {
  it('should push onto _includes', function() {
    const builder = newEmptyBuilder()
    builder.include('.bob')
    const includes = (builder as any)._includes
    assert.lengthOf(includes, 1)
    assert.lengthOf(includes[0], 1)
    assert.equal(includes[0][0], '.bob')
  })

  it('should accept an array', function() {
    const builder = newEmptyBuilder()
    builder.include(['.alice', '.bob'])
    const includes = (builder as any)._includes
    assert.lengthOf(includes, 1)
    assert.lengthOf(includes[0], 2)
    assert.equal(includes[0][0], '.alice')
    assert.equal(includes[0][1], '.bob')
  })

  it('should return itself', function() {
    assert.instanceOf(newEmptyBuilder().include('.bob'), Builder)
  })
})

describe('exclude', function() {
  it('should push onto _excludes', function() {
    const builder = newEmptyBuilder()
    builder.exclude('.bob')
    const excludes = (builder as any)._excludes
    assert.lengthOf(excludes, 1)
    assert.lengthOf(excludes[0], 1)
    assert.equal(excludes[0][0], '.bob')
  })

  it('should return itself', function() {
    assert.instanceOf(newEmptyBuilder().exclude('.bob'), Builder)
  })
})

describe('options', function() {
  it('should clobber _options with provided parameter', function() {
    const builder = newEmptyBuilder()
    const opt1 = {
      rules: {
        name: 'bob'
      }
    }
    const opt2 = {
      rules: {
        name: 'fred'
      }
    }
    builder.options(opt1)
    assert.deepEqual((builder as any)._options, opt1)
    builder.options(opt2)
    assert.deepEqual((builder as any)._options, opt2)
  })

  it('should return itself', function() {
    const opt = {
      rules: {
        name: 'bob'
      }
    }
    assert.instanceOf(newEmptyBuilder().options(opt), Builder)
  })
})

describe('disableRules', function() {
  it('should properly populate _options.rules with the provided parameter', function() {
    const builder = newEmptyBuilder()
    const colorRule = 'color-contrast'
    const landmarkRule = 'landmark'
    let expectedInternalState: any = {}

    builder.disableRules(colorRule)
    expectedInternalState[colorRule] = {
      enabled: false
    }
    assert.deepEqual(
      (builder as any)._options.rules,
      expectedInternalState
    )

    builder.disableRules([colorRule, landmarkRule])
    expectedInternalState[landmarkRule] = {
      enabled: false
    }
    assert.deepEqual(
      (builder as any)._options.rules,
      expectedInternalState
    )

    builder.disableRules(colorRule)
    expectedInternalState = {
      'color-contrast': {
        enabled: false
      }
    }
    assert.deepEqual(
      (builder as any)._options.rules,
      expectedInternalState
    )
  })

  it('should return itself', function() {
    assert.instanceOf(
      newEmptyBuilder().disableRules('color-contrast'),
      Builder
    )
  })
})
