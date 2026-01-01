import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN || "domain";

// FIXME: This needs to be moved to types
interface User {
  steamid: string;
  communityvisibilitystate: number;
  profilestate?: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  avatarhash: string;
  lastlogoff?: number;
  personastate?: number;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
}

interface MatchSummary {
  account_id: number;
  match_id: number;
  hero_id: number;
  hero_level: number;
  start_time: number;
  game_mode: number;
  match_mode: number;
  player_team: number;
  player_kills: number;
  player_deaths: number;
  player_assists: number;
  denies: number;
  net_worth: number;
  last_hits: number;
  team_abandoned?: boolean;
  abandoned_time_s?: number;
  match_duration_s: number;
  match_result: number;
  objectives_mask_team0: number;
  objectives_mask_team1: number;
}

const ProfilePage: React.FC = () => {
  const { steam_id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchSummary[]>([]);

  useEffect(() => {
    fetch(`http://${backendDomain}/account/steam/${steam_id}`)
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [steam_id]);

  useEffect(() => {
    fetch(`http://${backendDomain}/account/match_history/${steam_id}`)
      .then((res) => res.json())
      .then((data) => setMatchHistory(data));
  }, [steam_id]);

  if (!user) return <div>Loading profile...</div>;

  return (
    <div style={{ marginTop: 40, textAlign: "center" }}>
      <h2>Profile</h2>
      <div><strong>Steam ID:</strong> {user.steamid}</div>
      <div><strong>Persona Name:</strong> {user.personaname}</div>
      <div><strong>Profile URL:</strong> <a href={user.profileurl} target="_blank" rel="noopener noreferrer">{user.profileurl}</a></div>
      <div><strong>Community Visibility State:</strong> {user.communityvisibilitystate}</div>
      {user.profilestate !== undefined && <div><strong>Profile State:</strong> {user.profilestate}</div>}
      {user.lastlogoff !== undefined && <div><strong>Last Logoff:</strong> {user.lastlogoff}</div>}
      {user.personastate !== undefined && <div><strong>Persona State:</strong> {user.personastate}</div>}
      {user.primaryclanid && <div><strong>Primary Clan ID:</strong> {user.primaryclanid}</div>}
      {user.timecreated !== undefined && <div><strong>Time Created:</strong> {user.timecreated}</div>}
      {user.personastateflags !== undefined && <div><strong>Persona State Flags:</strong> {user.personastateflags}</div>}
      <div style={{ margin: "20px 0" }}>
        <strong>Avatar:</strong><br />
        <img src={user.avatar} alt="avatar" style={{ margin: 4, borderRadius: 4 }} />
        <img src={user.avatarmedium} alt="avatar medium" style={{ margin: 4, borderRadius: 4 }} />
        <img src={user.avatarfull} alt="avatar full" style={{ margin: 4, borderRadius: 4, maxWidth: 128 }} />
      </div>
      <div><strong>Avatar Hash:</strong> {user.avatarhash}</div>
      <h3>Match History</h3>
      <ul>
        {matchHistory.map((match) => (
          <li key={match.match_id}>
            Match ID: <Link to={`/match/analysis/${match.match_id}`}>{match.match_id}</Link> | Hero ID: {match.hero_id} | K/D/A: {match.player_kills}/{match.player_deaths}/{match.player_assists} | Result: {match.match_result} | Duration: {match.match_duration_s}s
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfilePage;
