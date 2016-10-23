# Redux Listener Middleware

A Redux middleware that acts as a gerneral listener on actions
that are dispatched to the Redux store.

## Installing the Middleware

The middleware itself can handle multiple listeners at the same time,
so it needs to be applied only once. 

```js
import listen from 'redux-listener-middleware';

const middleware = listen(); //get a new instance of the middleware

const store = createStore( //redux default
  reducer, // your very own reducer
  applyMiddleware( // redux standard
    thunk, // other middleware probably should be chained BEFORE the interceptor
    middleware // interceptor middleware
  )
);
```

## Creating a Listener

As a second step, the middleware can be augmented with listeners working
on incoming actions.

```js
const middleware = listen(); // you've seen this before
middleware.createListener((action, dispatch) => { // the action and redux's dispatch are handed over
  doSomethingWithThe(action)
    .then(payload => dispatch({type: 'ASYNC_ACTION', payload})) // so yo can dispatch other actions anytime later on
});
```

## Creating Rules for the Listener

Per se the listener doesn't react on any action. You must provide rules to
activate their work.

```js
// a super simple log listener
const logListener = (action) => {
  console.log(action);
}

const middleware = listen();
middleware.createListener(logListener).addRule(/^FETCH/); //logs all actions that start with "FETCH"
```

Before being handled by a listener, the action can be modified by the rule
e.g. to add data common to all actions of that kind.

```js
// a simple resource fetching listener
const resourceListener = (action, dispatch) => {
  fetch(action.payload.url)
    .then(res => res.json())
    .then(payload => dispatch({type: action.type + '.result', payload})); // C
}

const middleware = listen();
middleware.createListener(resourceListener)
  .addRule(
    /^fetch/,
    action => Object.assign(action, {payload: '/api/resources/' + action.type.split('.')[1]}) // B
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
errorhandling, dynamic query parameters and so on. But you can see how it
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
    ['fetch.user', action => ({type: 'resource', payload: `/api/users/${action.payload.id}`})],
    ['fetch.lastMessages', action => ({type: 'resource', payload: `/api/users/${action.payload.userId}/messages/last`})],
    ['fetch.notifications', action => ({type: 'resource', payload: `/api/users/${action.payload.userId}/notifications`})],
    ['fetch.tasks', action => ({type: 'resource', payload: `/api/tasks?assignee=${action.payload.userName}`})],
  ]);

//somewhere in the code
dispatch({type: 'fetch.user'}); // A
```

## Possibilities

I hope - no, I'm sure - you can already imagine the possibilities that you
can handle with this tool. to name but a few:

- user tracking with plain actions

- monitoring performance in combination with navigator.sendBeacon()

- chaining - an action that is dispatched by a listener of course again
  can be handled by another listener

- doing stuff with streams. rx.js could be banned into listeners and fire
  dispatches centrally

- building bridges to legacy code parts

- saving data in and recovering data from indexed db or local storage

- listeners can be self containing and therefore shipped as npm packages
  including their rule set

And so on ...

## API in Detail

### `listen()`

The only export of the package is a function.

- **Params:**
  - none

- **Returns:**
  A fresh middleware. For the unlikely case that you have more than one
  Redux store in place, you can also manage several listener middleware
  instances.

### `middleware.createListener(runner)`

- **Params:**
  - `runner`: the main handler function that gets handed over the following
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
