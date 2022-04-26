
async function refreshMMR(entry) {
  const params = new URLSearchParams({ lobby_type: 7 });
  const url = `https://api.opendota.com/api/players/${entry.player_id}/matches?${params.toString()}`;
  const response = await fetch(url);
  let match_id = entry.match_id;
  let mmr = entry.mmr;
  const matches = await response.json();
  for (const match of matches) {
    if (match.match_id <= entry.match_id)
      continue;
    const is_radiant = match.player_slot < 128;
    const is_leaver = match.leaver_status > 0;
    const is_winner = !is_leaver && is_radiant == match.radiant_win;
    const is_solo = match.party_size <= 1;
    match_id = Math.max(match_id, match.match_id);
    mmr += (is_winner ? 1 : -1) * (is_solo ? 30 : 20);
  }
  return { ...entry, match_id, mmr };
}

const EntryState = Object.freeze({
  READY: Symbol('ready'),
  LOADING: Symbol('loading'),
  ERROR: Symbol('error'),
});

function PlayerEntry(props) {
  const [state, setState] = React.useState(EntryState.READY);
  const [entry, setEntry] = React.useState(props);
  function display(value) {
    return state == EntryState.READY ? value : state.description;
  }
  async function refresh() {
    setState(EntryState.LOADING);
    try {
      setEntry(await refreshMMR(entry));
      setState(EntryState.READY);
    }
    catch (err) {
      setState(EntryState.ERROR);
    }
  }
  React.useEffect(refresh, []);
  return <tr>
    <th scope="row">
      <a href={`https://www.opendota.com/players/${entry.player_id}`}>
        {entry.player_id}
      </a>
    </th>
    <td>
      {display(
        <a href={`https://www.opendota.com/matches/${entry.match_id}`}>
          {entry.match_id}
        </a>
      )}
    </td>
    <td>{display(entry.mmr)}</td>
  </tr>;
}

function PlayerTable(props) {
  return <table className="table table-striped">
    <thead>
      <tr>
        <th scope="col">Player ID</th>
        <th scope="col">Match ID</th>
        <th scope="col">MMR</th>
      </tr>
    </thead>
    <tbody>
      {props.entries.map(entry => (
        <PlayerEntry key={entry.player_id} {...entry} />
      ))}
    </tbody>
  </table>;
}

const players = [
  // a mysterious person
  {
    "player_id": 431892272,
    "match_id": 6515528703,
    "mmr": 760,
  }
];

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<PlayerTable entries={players} />);
