(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.webapi = {}));
}(this, (function (exports) { 'use strict';

const Heroes = {};
for (const hero of dota2_webapi_heroes) {
  Heroes[hero.id] = hero;
  Heroes[hero.name] = hero;
}

const LobbyTypes = {};
for (const id in dota2_webapi_lobby_types) {
  const lobby_type = dota2_webapi_lobby_types[id];
  LobbyTypes[lobby_type.id] = lobby_type;
  LobbyTypes[lobby_type.name] = lobby_type;
}

function isRecalibration(player, match) {
  for (const { start, end } of player.recalibration)
    if (start <= match.match_id && match.match_id <= end)
      return true;
  return false;
}

function getMatchScore(player, match) {
  if (match.lobby_type != LobbyTypes.lobby_type_ranked.id)
    return 0;
  const is_radiant = match.player_slot < 128;
  const is_leaver = match.leaver_status > 0;
  const is_winner = !is_leaver && is_radiant == match.radiant_win;
  const is_solo = match.party_size <= 1;
  const is_recal = isRecalibration(player, match);
  return (is_winner ? 1 : -1) * (is_recal ? 75 : is_solo ? 30 : 20);
}

async function fetchMatchHistory(entry) {
  const url = `https://api.opendota.com/api/players/${entry.player_id}/matches`;
  const response = await fetch(url);
  const matches = await response.json();
  matches.sort((a, b) => {
    return a.match_id - b.match_id;
  });
  { // go backward
    let mmr = entry.anchor.mmr;
    for (var i = matches.length - 1; i >= 0; --i) {
      const match = matches[i];
      if (match.match_id > entry.anchor.match_id)
        continue;
      match.mmr = mmr;
      mmr = Math.max(0, mmr - getMatchScore(entry, match));
    }
  }
  { // go forward
    let mmr = entry.anchor.mmr;
    for (var i = 0; i < matches.length; ++i) {
      const match = matches[i];
      if (match.match_id <= entry.anchor.match_id)
        continue;
      mmr = Math.max(0, mmr + getMatchScore(entry, match));
      match.mmr = mmr;
    }
  }
  return matches;
}

exports.Heroes = Heroes;
exports.LobbyTypes = LobbyTypes;
exports.fetchMatchHistory = fetchMatchHistory;

})));
