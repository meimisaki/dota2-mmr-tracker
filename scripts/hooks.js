(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.hooks = {}));
}(this, (function (exports) { 'use strict';

const { useEffect, useState } = React;

function useAsyncData(fn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    async function execute() {
      try {
        setData(await fn());
      }
      catch (err) {
        setError(err);
      }
    }
    // DO NOT await within useEffect
    execute();
  }, []);
  return [data, error];
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const callback = event => setMatches(event.matches);
    setMatches(mql.matches);

    if (mql.addEventListener)
      mql.addEventListener('change', callback);
    else
      mql.addListener(callback);

    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', callback);
      else
        mql.removeListener(callback);
    };
  }, [query]);
  return matches;
}

exports.useAsyncData = useAsyncData;
exports.useMediaQuery = useMediaQuery;

})));
