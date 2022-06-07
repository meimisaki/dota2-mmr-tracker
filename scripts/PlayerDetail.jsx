(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.PlayerDetail = {}));
}(this, (function (exports) { 'use strict';

const { useMemo, useState } = React;
const { useParams } = ReactRouterDOM;
const { useAsyncData } = hooks;
const { fetchMatchHistory } = webapi;
const Plot = createPlotlyComponent['default'](Plotly);

const heroMap = {};
for (const hero of dota2_webapi_heroes)
  heroMap[hero.id] = hero.localized_name;

const plotStyle = { width: '100%', minWidth: 640 };

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

function MMRHistoryCurve(props) {
  const { matches } = props;
  const { data, layout } = useMemo(() => {
    const x = [], y = [], text = [], color = [], size = [];
    if (matches)
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
      type: 'scattergl',
      mode: 'lines+markers',
      marker: { color, size },
    };
    const layout = {
      title: 'Ranked MMR History',
      xaxis: { title: 'Match' },
      yaxis: { title: 'MMR' },
    };
    return { data: [trace], layout };
  }, [matches]);
  return <Plot style={plotStyle} data={data} layout={layout} />;
}

function roundToHour(time) {
  return Math.floor(time / 3600) * 3600;
}

function getTimeBin(time) {
  const hours = new Date(time * 1000).getHours();
  const suffix = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 || 12}${suffix}`;
}

function PlayTimeHistogram(props) {
  const { matches } = props;
  const [time, setTime] = useState(() => roundToHour(Date.now() / 1000));
  const { data, layout } = useMemo(() => {
    const x = [], y = [], category = [];
    const xbegin = time - 3600 * 23;
    const xend = time + 3600 * 1;
    for (let now = xbegin; now < xend; now += 3600)
      category.push(getTimeBin(now));
    if (matches)
      for (let i = 0; i < matches.length; ++i) {
        const match = matches[i];
        const start = match.start_time;
        const end = start + match.duration;
        for (let now = start; now < end;) {
          const next = roundToHour(now) + 3600;
          const elapsed = Math.min(next, end) - now;
          if (xbegin <= now && now < xend) {
            x.push(getTimeBin(now));
            y.push(elapsed / 60);
          }
          now += elapsed;
        }
      }
    const trace = {
      x,
      y,
      type: 'histogram',
      histfunc: 'sum',
    };
    const layout = {
      title: 'Play Time in the Past 24H',
      xaxis: {
        title: 'Interval in Hours',
        fixedrange: true,
        range: [-1, 24],
        categoryarray: category,
      },
      yaxis: {
        title: 'Duration in Minutes',
        fixedrange: true,
        range: [0, 61],
      },
    };
    return { data: [trace], layout };
  }, [matches, time]);
  return <Plot style={plotStyle} data={data} layout={layout} />;
}

function findPlayerEntry(player_id) {
  for (const entry of tracking_players)
    if (entry.player_id == player_id)
      return entry;
  return null;
}

function PlayerDetail(props) {
  const { player_id } = useParams();
  const entry = findPlayerEntry(player_id);
  const [matches, error] = useAsyncData(() => fetchMatchHistory(entry));
  return <div>
    <dl className="summary">
      <dt>Player ID</dt>
      <dd>
        <a href={`https://www.opendota.com/players/${entry.player_id}`}>
          {entry.player_id}
        </a>
      </dd>
    </dl>
    <MMRHistoryCurve matches={matches} />
    <PlayTimeHistogram matches={matches} />
  </div>;
}

exports['default'] = PlayerDetail;

})));