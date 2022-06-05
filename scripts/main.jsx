(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.main = {}));
}(this, (function (exports) { 'use strict';

const { HashRouter: Router, Routes, Route } = ReactRouterDOM;
const { 'default': PlayerDetailComponent } = PlayerDetail;
const { 'default': PlayerTableComponent } = PlayerTable;

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <Router>
    <Routes>
      <Route index element={<PlayerTableComponent entries={tracking_players} />} />
      <Route path="/players/:player_id" element={<PlayerDetailComponent />} />
    </Routes>
  </Router>
);

})));
