module.exports = {
  getInitialURL: async () => null,
  addEventListener: () => ({ remove: () => {} }),
  parse: (url) => {
    try {
      const u = new URL(url);
      const queryParams = {};
      u.searchParams.forEach((v, k) => { queryParams[k] = v; });
      return { path: u.pathname, queryParams };
    } catch {
      return { path: '', queryParams: {} };
    }
  },
  createURL: (path) => 'remindly://' + path,
};
