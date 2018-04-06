# babel-plugin-promisify-async-callback

Babel plugin to promisify callback-based functions with async notation at transpilation.

## Why?

- `async`/`await` feels great, promises not so much.
- Wrapping _everything_ in `return new Promise((resolve, reject) => { ... })` is utterly redundant (to write yourself).
- Sometimes, there's nothing like a good ol'callback.

## Install

Install as development dependency:

```
yarn add --dev git://github.com/withDouble/babel-plugin-promisify-async-callback.git
```

Add this to your .babelrc file:

```
{
  ...
  "plugins": [
    "promisify-async-callback"
    ...
  ]
}
```

## Usage

Write "Error-First Callback" functions (because of the existing codebase, style preference, whatever), and use them either as "errback" functions or as returning a Promise.
- Mark the function as `async`
- Name its last argument (the callback) `cb`

### You like/have callbacks...

Instead of writing

```js
function fetchUser (userId, cb) {
  api.getUser(userId, cb)
}
```

just add `async`

```js
async function fetchUser (userId, cb) {
  api.getUser(userId, cb)
}
``` 

and use with callbacks/promises/async/await.

### ...but want to get on the promise/async/await train?

Instead of writing this novel

```js
function fetchUser (userId) {
  return new Promise((resolve, reject) => {
    api.getUser(userId, (error, user) => {
      if (error) {
        reject(error)
      }
      else {
        resolve(user)
      }
    })
  })
}
```
keep it simple

```js
async function fetchUser (userId, cb) {
  api.getUser(userId, cb)
}
``` 

and use with callbacks/promises/async/await.

### So in the end

This function 

```js
async function fetchUser (userId, cb) {
  api.getUser(userId, cb)
}
``` 

can be used with callbacks

```js
fetchUser('jdoe', (error, user) => {
  ...
})
```

or promises

```js
fetchUser('jdoe')
  .then(user => { ... })
  .catch(error => { ... })
```

or async/await

```js
try {
  const user = await fetchUser('jdoe')
}
catch (error) {
  ...
}
```

## Gotchas :warning:

While you can _use_ the function any way you want, you still have to _write_ it as a callback-based function:
- Don’t `throw` any error, pass them through the callback `cb(error)`
- Don’t `return` the result, pass it through the callback `cb(null, result)`
- Don’t `await`

## What does it actually do?

It wraps the function body in `return new Promise((resolve, reject) => { ... })` 😄
and still calls `cb` if one has been passed.

```js
async function fetchUser (userId, cb) {
  api.getUser(userId, cb)
}
```

transpiles to

```js
async function fetchUser (userId, cb) {
  const fn = cb => {
    api.getUser(userId, cb)
  }

  return new Promise((resolve, reject) => {
    fn(function(err, ...args) {
      if (typeof cb === 'function') {
        cb(err, ...args)
      }
      if (err) {
        reject(err)
      }
      else {
        resolve(...args)
      }
    })
  })
}
```

(ok not exactly _that_, go check the code, it's pretty short)
