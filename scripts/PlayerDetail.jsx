(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.PlayerDetail = {}));
}(this, (function (exports) { 'use strict';

const { useMemo, useState } = React;
const { useParams } = ReactRouterDOM;
const { useAsyncData, useMediaQuery } = hooks;
const { Heroes, GameModes, LobbyTypes, fetchMatchHistory, fetchPlayerData } = webapi;
const Plot = createPlotlyComponent['default'](Plotly);
const plotStyle = { width: '100%' };

function getMatchText(match) {
  const start = new Date(match.start_time * 1000);
  const duration = new Date(match.duration * 1000);
  const hero = Heroes[match.hero_id] || {};
  const mode = GameModes[match.game_mode] || {};
  const lobby = LobbyTypes[match.lobby_type] || {};
  const side = match.player_slot < 128 ? 'Radiant' : 'Dire';
  return [
    `ID: ${match.match_id}`,
    `Hero: ${hero.localized_name}`,
    `KDA: ${match.kills}/${match.deaths}/${match.assists}`,
    `Mode: ${mode.name}`,
    `Lobby: ${lobby.name}`,
    `Party: ${match.party_size}`,
    `Side: ${side}`,
    `Date: ${start.toLocaleDateString()}`,
    `Time: ${start.toLocaleTimeString()}`,
    `Duration: ${duration.toISOString().slice(11, 19)}`,
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
  const darkmode = useMediaQuery('(prefers-color-scheme: dark)');
  const { data, layout } = useMemo(() => {
    const x = [], y = [], text = [], color = [], size = [];
    let index = 0;
    for (const match of matches || []) {
      x.push(++index);
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
      template: darkmode ? plotly_dark_theme : null,
      title: 'Ranked MMR History',
      xaxis: { title: 'Match' },
      yaxis: { title: 'MMR' },
    };
    return { data: [trace], layout };
  }, [matches, darkmode]);
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
  const darkmode = useMediaQuery('(prefers-color-scheme: dark)');
  const [time, setTime] = useState(() => roundToHour(Date.now() / 1000));
  const { data, layout } = useMemo(() => {
    const x = [], y = [], category = [];
    const xbegin = time - 3600 * 23;
    const xend = time + 3600 * 1;
    for (let now = xbegin; now < xend; now += 3600)
      category.push(getTimeBin(now));
    for (const match of matches || []) {
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
      template: darkmode ? plotly_dark_theme : null,
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
  }, [matches, darkmode, time]);
  return <Plot style={plotStyle} data={data} layout={layout} />;
}

const playerMap = {};
for (const entry of tracking_players)
  playerMap[entry.player_id] = { ...entry, tracked: true };

function findPlayerEntry(player_id) {
  if (player_id in playerMap)
    return playerMap[player_id];
  const anchor = { match_id: 0, mmr: 0 };
  const recalibration = [];
  return { player_id, anchor, recalibration, tracked: false };
}

function decodeRankTier(player) {
  const leaderboard = player?.leaderboard_rank || 0;
  const rank = player?.rank_tier || 0;
  const medal = Math.trunc(rank / 10);
  const star = rank % 10;
  const variant = (() => {
    if (0 < leaderboard && leaderboard <= 10)
      return 'c';
    if (10 < leaderboard && leaderboard <= 100)
      return 'b';
    return '';
  })();
  const baseUrl = 'https://www.opendota.com/assets/images/dota2/rank_icons';
  const medalUrl = `${baseUrl}/rank_icon_${medal}${variant}.png`;
  const starUrl = star ? `${baseUrl}/rank_star_${star}.png` : '';
  const leaderboardText = 0 < leaderboard && leaderboard <= 1000 ? `${leaderboard}` : '';
  return [medalUrl, starUrl, leaderboardText];
}

function PlayerDetail(props) {
  const { player_id } = useParams();
  const entry = useMemo(() => findPlayerEntry(player_id), [player_id]);
  const [player, error] = useAsyncData(() => fetchPlayerData(entry));
  const [matches, ignore] = useAsyncData(() => fetchMatchHistory(entry));
  const reader = fn => error ? 'Error' : (player ? fn(player) : 'Loading');
  const [medalUrl, starUrl, leaderboardText] = decodeRankTier(player);
  const mmr = matches?.length ? matches[matches.length - 1].mmr : 0;
  return <div>
    <dl className="summary">
      <dt>
        <img src={player?.profile?.avatarfull || ''} />
      </dt>
      <dd className="rank">
        <img className="medal" src={medalUrl} />
        <img className="star" src={starUrl} />
        <span className="leaderboard">{leaderboardText}</span>
      </dd>
      <dt>Steam ID</dt>
      <dd>
        <a href={player?.profile?.profileurl || ''}>
          {reader(player => player.profile.steamid)}
        </a>
      </dd>
      <dt>Player ID</dt>
      <dd>
        <a href={`https://www.opendota.com/players/${entry.player_id}`}>
          {entry.player_id}
        </a>
      </dd>
      <dt>Player Name</dt>
      <dd>
        {reader(player => player.profile.personaname)}
      </dd>
      <dt>MMR Estimated</dt>
      <dd>
        {reader(player => player.mmr_estimate.estimate || 0)}
      </dd>
      <dt>MMR Tracked</dt>
      <dd>
        {entry.tracked ? mmr : 'Untracked'}
      </dd>
      <dt>Dota Plus</dt>
      <dd>
        {reader(player => player.profile.plus ? 'Active' : 'Inactive')}
      </dd>
    </dl>
    <MMRHistoryCurve matches={matches} />
    <PlayTimeHistogram matches={matches} />
  </div>;
}

exports['default'] = PlayerDetail;

})));
