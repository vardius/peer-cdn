export default async function applyMiddleware(...middlewares) {
  return event => {
    return compose(...middlewares)(event);
  };
}

export async function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => async (...args) => await a(await b(...args)));
}
