module.exports = () => {
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

  middleware.createListener = (runner) => {
    const listener = {
      runner,
      rules: []
    };
    listeners.push(listener);

    return {
      addRule: (matcher, modifier = action => action) => listener.rules.push({ matcher, modifier })
    };
  };

  return middleware;
};
