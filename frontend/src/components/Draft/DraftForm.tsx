import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from '@mui/material';
import { getTeamsByDivision } from '../../api/team';
import type { Team } from '../../models/team';

interface TeamSelectorProps {
  divisionId: number;
  selectedTeams: number[];
  setSelectedTeams: (ids: number[]) => void;
}

const DraftForm: React.FC<TeamSelectorProps> = ({ divisionId, selectedTeams, setSelectedTeams }) => {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!divisionId) return;
    getTeamsByDivision(divisionId).then(setTeams);
  }, [divisionId]);

  const handleChange = (event: any) => {
    setSelectedTeams(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>Teams</InputLabel>
      <Select
        multiple
        value={selectedTeams}
        onChange={handleChange}
        renderValue={(selected) =>
          teams.filter(t => selected.includes(t.id)).map(t => t.name).join(', ')
        }
      >
        {teams.map(team => (
          <MenuItem key={team.id} value={team.id}>
            <Checkbox checked={selectedTeams.includes(team.id)} />
            <ListItemText primary={team.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DraftForm;