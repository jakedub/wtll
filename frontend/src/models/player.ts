// src/models/player.ts
import type { Evaluation } from "./evaluation";
export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip_code: string;
  batting_hand: string;
  throwing_hand: string;
  team?: {
    id: number;
    name: string;
  };
  division?: {
    id: number;
    name: string;
  };
  positions: { id: number; code: string }[];
  created_at: string;
  updated_at: string;
  sport: string;
  program: string;
  is_allstar: boolean;
  is_showcase: boolean;
  assignedPosition?: string;
  latitude?: number;
  longitude?: number;
  in_district?: boolean;
  full_name?: string;
  jersey_size: string;
  teammate_request: string;
  coach_request: string;
  residency_same_as_account: boolean;
  interested_in_showcase: boolean;
  is_eligible: boolean;
  school_name: string;
  evaluations?: Evaluation[];

}