import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const backendDomain = process.env.REACT_APP_BACKEND_DOMAIN || "domain";

const ProfilePage: React.FC = () => {
  const { steam_id } = useParams();
  const [user, setUser] = useState<{ steam_id: string } | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);

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
      <div>Steam ID: {user.steam_id}</div>
      <h3>Match History</h3>
      <ul>
        {matchHistory.map((match) => (
          <li key={match.id}>{match.details}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProfilePage;
