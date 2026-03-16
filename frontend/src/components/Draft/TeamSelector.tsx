import React, { useState, useEffect } from "react";
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from "@mui/material";
import type { Team } from "../../models/team";
import { getTeamsByDivision } from "../../api/team";

interface TeamSelectorProps {
  divisionId: number;                // Division to fetch teams for
  selectedTeams: number[];           // Currently selected team IDs
  setSelectedTeams: (ids: number[]) => void;  // Setter for selected teams
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  divisionId,
  selectedTeams,
  setSelectedTeams,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!divisionId) return;

    const fetchTeams = async () => {
      try {
        const data = await getTeamsByDivision(divisionId);
        setTeams(data || []);
        console.log(`Loaded teams for division ${divisionId}:`, data);
      } catch (err) {
        console.error("Failed to load teams:", err);
      }
    };

    fetchTeams();
  }, [divisionId]);

  const handleChange = (event: any) => {
    const value = event.target.value as number[];
    setSelectedTeams(value);
    console.log("Selected teams updated:", value);
  };

  return (
    <FormControl sx={{ minWidth: 200, height: 50 }}>
      <InputLabel>Teams</InputLabel>
      <Select
        multiple
        value={selectedTeams}
        onChange={handleChange}
        renderValue={(selected: number[]) =>
          teams
            .filter((t) => selected.includes(t.id))
            .map((t) => t.name)
            .join(", ")
        }
        sx={{ height: 50 }}
      >
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            <Checkbox checked={selectedTeams.includes(team.id)} />
            <ListItemText primary={team.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TeamSelector;