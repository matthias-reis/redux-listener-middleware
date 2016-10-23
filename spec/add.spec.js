/* eslint-env jest */

const redux = require('redux');
const listen = require('../src/index');
// import { createStore } from 'redux';

const reducer = (state = 0, action) => {
  if (action.type === 'INCREMENT') {
    return state + 1;
  } else {
    return state;
  }
};

const increment = { type: 'INCREMENT' };

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
    const mw = listen();

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

    const mw = listen();
    mw.createListener(listenerSpy);

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
  });

  it('adds string based rules to a listener', (done) => {
    const listenerSpy = jest.fn();

    const mw = listen();
    mw.createListener(listenerSpy).addRule('INCREMENT');

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

    const mw = listen();
    mw.createListener(listenerSpy).addRule(/^INCR/);

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

  it('calls listeners correctly', (done) => {
    const listener = (action) => {
      expect(action.type).toEqual('INCREMENT');
      expect(action.payload).toBeUndefined();
      done();
    };

    const mw = listen();
    mw.createListener(listener).addRule('INCREMENT');

    const store = redux.createStore(
      reducer,
      redux.applyMiddleware(mw)
    );

    store.dispatch(increment);
  });

  it('can mutate actions with rules', (done) => {
    const listener = (action) => {
      expect(action.type).toEqual('INCREMENT');
      expect(action.payload).toBeDefined();
      expect(action.payload.foo).toEqual('bar');
      done();
    };

    const mw = listen();
    mw.createListener(listener).addRule('INCREMENT', action => {
      action.payload = { foo: 'bar' };
      return action;
    });

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

    const listener = (action, dispatch) => {
      setTimeout(() => {
        dispatch(asyncAction(action.payload));
        done();
      }, 10);
    };

    const mw = listen();
    mw.createListener(listener).addRule('ADD_USER', action => ({
      type: 'ADD_USER',
      payload: { firstName: 'Foo', lastName: 'Bar' }
    }));

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
