(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.main = {}));
}(this, (function (exports) { 'use strict';

const { useCallback, useMemo } = React;
const { useNavigate, HashRouter: Router, Routes, Route } = ReactRouterDOM;
const { 'default': PlayerDetailComponent } = PlayerDetail;
const { 'default': PlayerTableComponent } = PlayerTable;

function App(props) {
  const navigate = useNavigate();
  const onSubmit = useCallback(event => {
    event.preventDefault();
    const player_id = event.target.elements.player_id.value;
    if (player_id)
      navigate(`/players/${player_id}`);
  }, [navigate]);
  const year = useMemo(() => new Date().getFullYear());
  return <div className="container">
    <nav className="navbar">
      <span className="navbar-brand h1">
        <a className="title" href="/">Dota2 MMR Tracker</a>
      </span>
      <form className="search" onSubmit={onSubmit}>
        <input className="form-control" type="number" placeholder="Player ID..." name="player_id" />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>
    </nav>
    <div className="content">
      <Routes>
        <Route index element={<PlayerTableComponent entries={tracking_players} />} />
        <Route path="/players/:player_id" element={<PlayerDetailComponent />} />
      </Routes>
    </div>
    <div className="footer">
      <span className="copyright">Copyright &copy; {year}</span>
      <a className="repository" href="https://github.com/meimisaki/dota2-mmr-tracker">View on Github</a>
    </div>
  </div>;
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <Router>
    <App />
  </Router>
);

})));
