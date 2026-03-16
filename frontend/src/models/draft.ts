// src/models/draft.ts
// import type { DraftSelection } from "./draft_selection";

// export interface Draft {
//     id: number;
//     name: string;
//     year: number;
//     created_at: string;
//     selections?: DraftSelection[];
// }
export interface DraftSelection {
    player_name: string;
    catcher_tier: any;
    pitcher_tier: any;
    last_name: any;
    first_name: any;
    tier_spot?: string;
    id: number;
    draft_id: number;
    player_id: number;
    team_id: number;
    division_id: number;
    selected_at: string;
    name: string;
    overall_total: number;
    total_catcher: number;
    total_fielding: number;
    total_hitting: number;
    total_pitching: number;
    total_throwing: number;
    is_pitcher: boolean;
    is_catcher: boolean;


    team_name?: string;
    division_name?: string;
}
export interface Draft {
    division_id(division_id: any): unknown;
    teams: any;
    id: number;
    name: string;
    year: number;
    created_at: string;
    selections?: DraftSelection[];


}