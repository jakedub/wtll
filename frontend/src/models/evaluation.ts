import type { Player } from "./player";

export interface Evaluation {
  coach_request: string;
  teammate_request: string;
  tier_spot?: number;
  id: number;
  player: Player;
  evaluator?: string; // e.g., coach name or user id
  season_year: number;
  hitting_form?: number;
  hitting_power?: number;
  hitting_contact?: number;
  total_hitting?: number;
  total_pitching?: number;
  total_catcher?: number;
  fielding_form?: number;
  fielding_glove?: number;
  fielding_hustle?: number;
  total_fielding?: number;
  throwing_form?: number;
  throwing_speed?: number;
  throwing_accuracy?: number;
  total_throwing?: number;
  range?: number;
  evaluation_type:string;
  pitching_speed?: number;
  pitching_accuracy?: number;
  catcher_receiving?: number;
  overall_total?: number;
  catcher_blocking?: number;
  created_at: string;
  updated_at: string;
}