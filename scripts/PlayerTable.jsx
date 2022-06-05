(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.PlayerTable = {}));
}(this, (function (exports) { 'use strict';

const { Link } = ReactRouterDOM;
const { useAsyncData } = hooks;
const { fetchMatchHistory } = webapi;

function PlayerEntry(props) {
  const { entry } = props;
  const [matches, error] = useAsyncData(() => fetchMatchHistory(entry))
  const reader = fn => error ? 'Error' : (matches ? fn(matches) : 'Loading');
  return <tr>
    <th scope="row">
      <a href={`https://www.opendota.com/players/${entry.player_id}`}>
        {entry.player_id}
      </a>
    </th>
    <td>
      {reader(matches => {
        const { match_id } = matches.at(-1);
        return <a href={`https://www.opendota.com/matches/${match_id}`}>
          {match_id}
        </a>
      })}
    </td>
    <td>
      {reader(matches => matches.at(-1).mmr)}
    </td>
    <td>
      <Link to={`/players/${entry.player_id}`}>Detail</Link>
    </td>
  </tr>;
}

function PlayerTable(props) {
  return <table className="table table-striped">
    <thead>
      <tr>
        <th scope="col">Player ID</th>
        <th scope="col">Match ID</th>
        <th scope="col">MMR</th>
        <th scope="col">Analysis</th>
      </tr>
    </thead>
    <tbody>
      {props.entries.map(entry => (
        <PlayerEntry key={entry.player_id} entry={entry} />
      ))}
    </tbody>
  </table>;
}

exports['default'] = PlayerTable;

})));
