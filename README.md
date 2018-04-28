# @withdouble/babel-plugin-promisify-async-callback

Babel plugin to promisify callback-based functions with async notation at transpilation.

## Install

Install as development dependency:

```
yarn add --dev @withdouble/babel-plugin-promisify-async-callback
```

Add this to your .babelrc file:

```
{
  ...
  "plugins": [
    "@withdouble/babel-plugin-promisify-async-callback"
    ...
  ]
}
```

## Usage

Write "Error-First Callback" functions (because of the existing codebase, style preference, whatever), and use them either as "errback" functions or as returning a Promise.
- Mark the function as `async`
- Name its last argument (the callback) `cb`

```js
// Let's say we have a `translator` library with callback-based methods
const translator = require('translator')

// Write a function as you normally would to consume that library,
// just add the `async` keyword to indicate it returns a Promise
async function translateToEnglish (word, cb) {
  translator.get(word, 'english', (error, wordInEnglish) => {
    if (error) {
      cb(error)
    }
    else {
      cb(null, wordInEnglish)
    }
  }
}

// or more simply
async function translateToEnglish (word, cb) {
  translator.get(word, 'english', cb)
}

// Then use your function as if it was callback-based...
translateToEnglish('bonjour', (error, translation) => {
  if (error) {
    console.error('Lost in translation')
  }
  else {
    console.log(`"Bonjour" means "${translation}"`)
  }
})

// ... or promise-based...
translateToEnglish('bonjour')
  .then(translation => {
    console.log(`"Bonjour" means "${translation}"`)
  })
  .catch(error => {
    console.error('Lost in translation')
  })

// ... or, more interestingly, with `await`
try {
  const translation = await translateToEnglish('bonjour')
  console.log(`"Bonjour" means "${translation}"`)
}
catch (error) {
  console.error('Lost in translation')
}
```

## Why?

- `async`/`await` feels great, promises not so much.
- Wrapping _everything_ in `return new Promise((resolve, reject) => { ... })` is utterly redundant (to write yourself).
- Sometimes, there's nothing like a good ol'callback.

## What does it actually do?

It wraps the function body in `return new Promise((resolve, reject) => { ... })` 😄
and still calls `cb` if one has been passed.

### Before

```js
async function translateToEnglish (word, cb) {
  translator.get(word, 'english', cb)
}
```

### After

```js
async function translateToEnglish (word, cb) {
  const fn = cb => {
    translator.get(word, 'english', cb)
  }

  return new Promise((resolve, reject) => {
    fn((() => {
      const _cb = function(err, ...args) {
        if (typeof cb === 'function') {
          cb(err, ...args)
        }
        if (err) {
          reject(err)
        }
        else {
          resolve(...args)
        }
      }
      _cb.resolve = _cb.bind(null, null)
      _cb.reject = _cb
      return _cb
    })())
  })
}
```
