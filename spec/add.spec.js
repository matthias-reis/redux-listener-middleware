/* eslint-env jest */

const redux = require('redux');
const createMiddleware = require('../src/index').createMiddleware;
const createListener = require('../src/index').createListener;
// import { createStore } from 'redux';

const reducer = (state = 0, action) => {
  if (action.type === 'INCREMENT') {
    return state + 1;
  } else if (action.type === 'DECREMENT') {
    return state - 1;
  } else {
    return state;
  }
};

const increment = { type: 'INCREMENT' };
const decrement = { type: 'DECREMENT' };

describe('middleware setup', () => {
  it('has set up the test runner correctly', () => {
    expect(true).toBeTruthy();
  });

  it('has initialized redux', (done) => {
    const store = redux.createStore(reducer);

    store.subscribe(() => {
      expect(store.getState()).toEqual(1);
      done();
    });

    store.dispatch(increment);
  });

  it('applies the listener middleware', (done) => {
    const mw = createMiddleware();

    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.dispatch(increment);

    store.subscribe(() => {
      expect(store.getState()).toEqual(2);
      done();
    });

    store.dispatch(increment);
  });

  it('registers a new listener', (done) => {
    const listenerSpy = jest.fn();

    const mw = createMiddleware();
    const listener = createListener(listenerSpy);
    mw.addListener(listener);

    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.subscribe(() => {
      expect(store.getState()).toEqual(1);
      expect(listenerSpy).not.toHaveBeenCalled();
      done();
    });

    store.dispatch(increment);
    store.dispatch({ foo: 'bar' }); // invalid actions handled gracefully
  });

  it('adds string based rules to a listener', (done) => {
    const listenerSpy = jest.fn();

    const mw = createMiddleware();
    const listener = createListener(listenerSpy).addRule('INCREMENT');
    mw.addListener(listener);
    
    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.subscribe(() => {
      expect(store.getState()).toEqual(1);
      expect(listenerSpy).toHaveBeenCalled();
      done();
    });

    store.dispatch(increment);
  });

  it('adds RegExp based rules to a listener', (done) => {
    const listenerSpy = jest.fn();

    const mw = createMiddleware();
    const listener = createListener(listenerSpy).addRule(/^INCR/);
    mw.addListener(listener);

    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.subscribe(() => {
      expect(store.getState()).toEqual(1);
      expect(listenerSpy).toHaveBeenCalled();
      done();
    });

    store.dispatch(increment);
  });

  it('adds multiple rules with chaining to a listener', (done) => {
    const listenerSpy = jest.fn();

    const mw = createMiddleware();
    const listener = createListener(listenerSpy).addRule(/^INCR/).addRule(/^DECR/);
    mw.addListener(listener);

    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.dispatch(increment);

    store.subscribe(() => {
      expect(store.getState()).toEqual(0);
      expect(listenerSpy).toHaveBeenCalledTimes(2);
      done();
    });

    store.dispatch(decrement);
  });

  it('adds multiple rules with addRules() to a listener', (done) => {
    const listenerSpy = jest.fn();

    const mw = createMiddleware();
    const listener = createListener(listenerSpy).addRules([ [ /^INCR/ ], [ /^DECR/ ] ]);
    mw.addListener(listener);

    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.dispatch(increment);

    store.subscribe(() => {
      expect(store.getState()).toEqual(0);
      expect(listenerSpy).toHaveBeenCalledTimes(2);
      done();
    });

    store.dispatch(decrement);
  });

  it('calls listeners correctly', (done) => {
    const runner = (action) => {
      expect(action.type).toEqual('INCREMENT');
      expect(action.payload).toBeUndefined();
      done();
    };

    const mw = createMiddleware();
    const listener = createListener(runner).addRule('INCREMENT');
    mw.addListener(listener);

    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.dispatch(increment);
  });

  it('can mutate actions with rules', (done) => {
    const runner = (action) => {
      expect(action.type).toEqual('INCREMENT');
      expect(action.payload).toBeDefined();
      expect(action.payload.foo).toEqual('bar');
      done();
    };

    const mw = createMiddleware();
    const listener = createListener(runner).addRule('INCREMENT', action => {
      action.payload = { foo: 'bar' };
      return action;
    });
    mw.addListener(listener);


    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.dispatch(increment);
  });

  it('can dispatch actions from the inside of a listener', (done) => {
    const syncAction = () => ({ type: 'ADD_USER' });
    const asyncAction = (user) => ({ type: 'SET_USER', payload: user });
    const storeSpy = jest.fn();

    const userReducer = (_, action) => {
      if (action.type === 'SET_USER') {
        return { user: action.payload };
      } else {
        return { user: {} };
      }
    };

    const runner = (action, dispatch) => {
      setTimeout(() => {
        dispatch(asyncAction(action.payload));
        done();
      }, 10);
    };

    const mw = createMiddleware();
    const listener = createListener(runner).addRule('ADD_USER', action => ({
      type: 'ADD_USER',
      payload: { firstName: 'Foo', lastName: 'Bar' }
    }));
    mw.addListener(listener);


    const store = redux.createStore(
      userReducer,
      redux.applyMiddleware(mw)
    );

    store.subscribe(() => {
      storeSpy();
    });

    store.dispatch(syncAction());
  });
});
