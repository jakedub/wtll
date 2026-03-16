import type { Division } from "./division";

export interface Team {
  year: number;
  id: number;
  name: string;
  division: Division;
  coach: string;
}