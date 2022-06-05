(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.PlayerDetail = {}));
}(this, (function (exports) { 'use strict';

const { useMemo } = React;
const { useParams } = ReactRouterDOM;
const { useAsyncData } = hooks;
const { fetchMatchHistory } = webapi;
const Plot = createPlotlyComponent['default'](Plotly);

function findPlayerEntry(player_id) {
  for (const entry of tracking_players)
    if (entry.player_id == player_id)
      return entry;
  return null;
}

const heroMap = {};
for (const hero of dota2_webapi_heroes)
  heroMap[hero.id] = hero.localized_name;

function getMatchText(match) {
  const start = new Date(match.start_time * 1000);
  const duration = new Date(match.duration * 1000);
  return [
    `Hero: ${heroMap[match.hero_id]}`,
    `KDA: ${match.kills}/${match.deaths}/${match.assists}`,
    `Party: ${match.party_size}`,
    `Date: ${start.toLocaleDateString()}`,
    `Time: ${start.toLocaleTimeString()}`,
    `Duration: ${duration.toISOString().substr(11, 8)}`,
  ].join('<br>');
}

function getMatchColor(match) {
  switch (match.leaver_status) {
  case 0: { // didn't leave
    const is_radiant = match.player_slot < 128;
    const is_winner = is_radiant == match.radiant_win;
    return is_winner ? 'royalblue' : 'orange';
  }
  case 1: // left safely
    return 'lightgreen';
  default: // abandoned
    return 'orangered';
  }
}

const plotStyle = { width: '100%' };

function PlayerDetail(props) {
  const { player_id } = useParams();
  const entry = findPlayerEntry(player_id);
  const [matches, error] = useAsyncData(() => fetchMatchHistory(entry));
  const { data, layout } = useMemo(() => {
    const x = [], y = [], text = [], color = [], size = [];
    if (matches && !error)
      for (let i = 0; i < matches.length; ++i) {
        const match = matches[i];
        x.push(i + 1);
        y.push(match.mmr);
        text.push(getMatchText(match));
        color.push(getMatchColor(match));
        size.push(match.leaver_status > 0 ? 8 : 4);
      }
    const trace = {
      x,
      y,
      text,
      type: 'scatter',
      mode: 'lines+markers',
      marker: { color, size },
    };
    const layout = {
      title: 'MMR History',
      xaxis: { title: 'Match' },
      yaxis: { title: 'MMR' },
    };
    return { data: [trace], layout };
  }, [matches, error]);
  return <div>
    <dl className="summary">
      <dt>Player ID</dt>
      <dd>
        <a href={`https://www.opendota.com/players/${entry.player_id}`}>
          {entry.player_id}
        </a>
      </dd>
    </dl>
    <Plot style={plotStyle} data={data} layout={layout} />
  </div>;
}

exports['default'] = PlayerDetail;

})));
