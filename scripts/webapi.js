(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.webapi = {}));
}(this, (function (exports) { 'use strict';

function isRecalibration(player, match) {
  for (const { start, end } of player.recalibration)
    if (start <= match.match_id && match.match_id <= end)
      return true;
  return false;
}

function getMatchScore(player, match) {
  const is_radiant = match.player_slot < 128;
  const is_leaver = match.leaver_status > 0;
  const is_winner = !is_leaver && is_radiant == match.radiant_win;
  const is_solo = match.party_size <= 1;
  const is_recal = isRecalibration(player, match);
  return (is_winner ? 1 : -1) * (is_recal ? 75 : is_solo ? 30 : 20);
}

async function fetchMatchHistory(entry) {
  const params = new URLSearchParams({ lobby_type: 7 });
  const url = `https://api.opendota.com/api/players/${entry.player_id}/matches?${params.toString()}`;
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

exports.fetchMatchHistory = fetchMatchHistory;

})));
