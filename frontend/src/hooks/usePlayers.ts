import { useEffect, useState } from "react";
import { getPlayers } from "../api/players";

export interface PlayerRow {
  row_number: number | null;
  id: number | null;
  player_id: number | null;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  in_district: boolean | null;
  date_of_birth: string | null;
  status: string;
  error?: string;
  jersey_size: string;
  teammate_request: string;
  coach_request: string;
  residency_same_as_account: boolean;
  interested_in_showcase: boolean;
  school_name: string;
  is_eligible:boolean;
  division?: {
    id: number;
    name: string;
  };
}

export const usePlayers = () => {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);

  const normalize = (data: any[]): PlayerRow[] =>
    data.map((p) => ({
      row_number: null,
      id: p.id,
      player_id: p.id,
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      address_line_1: p.address_line_1 ?? "",
      address_line_2: p.address_line_2 ?? "",
      city: p.city ?? "",
      state: p.state ?? "",
      zip: p.zip ?? "",
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      in_district: p.in_district ?? null,
      date_of_birth: p.date_of_birth ?? null,
      status: p.latitude && p.longitude ? "SUCCESS" : "MISSING",
      jersey_size: p.jersey_size ?? "",
      teammate_request: p.teammate_request ?? "",
      coach_request: p.coach_request ?? "",
      residency_same_as_account: p.residency_same_as_account ?? false,
      interested_in_showcase: p.interested_in_showcase ?? false,
      is_eligible: p.is_eligible ?? false,
      division: p.division,
      school_name: p.school_name ?? "",
    }));

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await getPlayers();
      setPlayers(normalize(data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  return { players, setPlayers, loadPlayers, loading };
};