const createMiddleware = () => {
  const listeners = [];

  const middleware = ({ getState, dispatch }) => next => action => {
    if (action.type) {
      listeners.forEach(listener => listener.rules.forEach(rule => {
        if ((rule.matcher instanceof RegExp && action.type.match(rule.matcher)) || action.type === rule.matcher) {
          const modifiedAction = rule.modifier(Object.assign({}, action));
          listener.runner(modifiedAction, dispatch);
        }
      }));
    }
    return next(action);
  };

  middleware.addListener = (listener) => listeners.push(listener);

  return middleware;
};

const createListener = (runner) => {
  const listener = {
    runner,
    rules: []
  };

  listener.addRule = (matcher, modifier = action => action) => {
    listener.rules.push({ matcher, modifier });
    return listener;
  };

  listener.addRules = rules => {
    rules.map(rule => listener.addRule(rule[ 0 ], rule[ 1 ]));
    return listener;
  };

  return listener;
};


module.exports = { createMiddleware, createListener };
