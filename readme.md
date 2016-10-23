# Redux Listener Middleware

A Redux middleware that acts as a gerneral listener on actions
that are dispatched to the Redux store.

```
> npm i -S redux-listener-middleware
```

```
> yarn add redux-listener-middleware
```

## Status

[![Build Status](https://travis-ci.org/matthias-reis/redux-listener-middleware.svg?branch=master)](https://travis-ci.org/matthias-reis/redux-listener-middleware)

[![npm version](https://badge.fury.io/js/redux-listener-middleware.svg)](https://badge.fury.io/js/redux-listener-middleware)

## What Problem Does This Solve?

[Redux](http://redux.js.org/) is currently the most popular implementation
of the javascript [flux](https://facebook.github.io/flux/) architecture.

It offers a robust data flow architecture for modern web applications by
providing a single and easy to follow flow chain and immutable handlers.

Unsafe or asynchronous activities like fetching data from a backend are
not directly supported and can be appended by a so called
[middleware](http://redux.js.org/docs/advanced/Middleware.html).

Using `redux-listener-middleware`, you can handle many different
scenarios without complicating or stressing the straight forward APIs
that e.g. React or Redux provide out of the box. You don't need to charge
your original data flow with *'intelligent'* actions as `redux-thunk` does.

Instead, you remain sideeffect free and pure and concentrate your
interactions with other subsystems (like the backend) into central pieces
of code, making it easy to maintain (like migrating from Rest to GraphQL).

## Installing the Middleware

The **middleware** itself can handle multiple listeners at the same time,
so it needs to be applied only once to a Redux store.

```js
import listen from 'redux-listener-middleware';

//get a new instance of the middleware
const middleware = listen();

const store = createStore(
  reducer,
  applyMiddleware(
    // other middleware probably should be chained BEFORE the listener
    // but most likely, you don't need any of them at all
    thunk,
    middleware // listener middleware
  )
);
```

## Creating a Listener

As a second step, the middleware will be augmented with **listeners** working
on incoming actions.

```js
const middleware = listen(); // you've seen this before

 // the action and redux's dispatch are handed over
middleware.createListener((action, dispatch) => {
  doSomethingWithThe(action)
    // ... so you can dispatch other actions anytime
    .then(payload => dispatch({type: 'ASYNC_ACTION', payload}))
});
```

## Creating Rules for the Listener

Per se, the listener doesn't interact with any of the incoming actions.
You must provide **rules** to activate their work.

```js
// a super simple log listener
const logListener = (action) => {
  console.log(action);
}

const middleware = listen();
middleware
  .createListener(logListener)
  .addRule(/^FETCH/);
  //logs all actions that start with "FETCH"
```

Before being handled by a listener, the action can be modified by the rule
e.g. to add data common to all actions of that kind.

```js
// a simple resource fetching listener
const resourceListener = (action, dispatch) => {
  fetch(action.payload.url)  // C
    .then(res => res.json())
    .then(payload => dispatch({
      type: action.type + '.result',
      payload
    }));
}

const middleware = listen();
middleware.createListener(resourceListener)
  .addRule(
    /^fetch/,
    action => Object.assign(action, {
      payload: '/api/resources/' + action.type.split('.')[1]
    }) // B
  );

//somewhere in the code
dispatch({type: 'fetch.user'}); // A
```

How this works:

- **A**: a simple dispatch somewhere in your code - this could easily be
  an action creator as well. You can handle it directly in a reducer, e.g.
  to start a loading indicator.

- **B**: but a listener rule also applies to it. It transforms the type
  of the action into a resource url and hands it over to the listener.
  This only happens internally. The action that reaches the reducer remains
  untouched.

- **C**: Finally the listener fetches the resource from the url and
  itself dispatches a new action of type `fetch.user.response` as soon
  as the response arrives, that can be reduced at your wishes.

To be clear, this implementation is very incomplete. It doesn't contain
errorhandling, dynamic query parameters and so on. But all of this could
be accomplished in some central lines of code and you can already see how it
restructures your application. In your react components, you only have to
deal with simple actions. The heavy lifting happens in one dedicated place
in your application.

On top of that, a listener is not only restricted to one single rule. It
can handle multiple rules at once:

```js
[...]

const middleware = listen();
middleware.createListener(resourceListener)
  .addRules([
    ['fetch.user', action => ({
      type: 'resource',
      payload: `/api/users/${action.payload.id}`
    })],
    ['fetch.lastMessages', action => ({
      type: 'resource', 
      payload: `/api/users/${action.payload.userId}/messages/last`
    })],
    ['fetch.notifications', action => ({
      type: 'resource',
      payload: `/api/users/${action.payload.userId}/notifications`
    })],
    ['fetch.tasks', action => ({
      type: 'resource',
      payload: `/api/tasks?assignee=${action.payload.userName}`
    })],
  ]);
```

## Possibilities

I hope - no, I'm sure - you can already imagine the challenges you
can handle with this tool. To name but a few:

- requiring **resources** instead of fetching data imperatively from
  a backend

- event based **tracking** with plain actions

- monitoring **performance** in combination with `navigator.sendBeacon()`

- chaining of listeners - an action that is dispatched by a listener
  of course again can be handled by another listener

- doing stuff with **streams**. `rx.js` could be banned into listeners and fire
  dispatches centrally

- building bridges to **legacy code parts**

- saving data in and recovering data from **indexed db** or **local storage**

- listeners can be self containing and therefore **shipped as npm packages**
  including their rule set

And so on ...

## API in Detail

### `listen()`

The only export of the package is a function that returns the middleware.

- **Params:** none

- **Returns:**
  A fresh middleware. For the unlikely case that you have more than one
  Redux store in place, you can also manage several listener middleware
  instances (by calling `listen()` again).

### `middleware.createListener(runner)`

- **Params:**
  - `runner`: the main handler function with the following attributes
    - `action`: the flux action object to handle
    - `dispatch(action: object)`: the original redux dispatch function

- **Returns:** A chainable toolset with:
  - `addRule`: applies a single rule
  - `addRules`: applies a set of rules with one single statement

## `toolset.addRule(rule, modifier)`

- **Params:**
  - `rule`: a string or a RegExp. The action type is matched against this.
  - `modifier`: (optional) a function, where you can preprocess the action. The action is
    handed over and the modified action must be returned.

- **Returns:** A chainable toolset with:
  - `addRule`: applies a single rule
  - `addRules`: applies a set of rules with one single statement

## `toolset.addRules(rules)`

- **Params:**
  - `rules`: an array of arrays consisting of `[rule, modifier]`. So
    `mw.addRule('foo', action => action).addRule('bar', action => action)` is the same as
    `mw.addRules([['foo', action => action], ['bar', action => action]])`

- **Returns:** A chainable toolset with:
  - `addRule`: applies a single rule
  - `addRules`: applies a set of rules with one single statement
