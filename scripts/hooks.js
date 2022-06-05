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

exports.useAsyncData = useAsyncData;

})));
