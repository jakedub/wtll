import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Autocomplete,
  Typography,
  Button,
  MenuItem,
} from '@mui/material';
import { RadarChart, ScatterChart } from '@mui/x-charts';
import { getTeams } from '../../api/team';
import { getPlayers } from '../../api/players';
import type { Player } from '../../models/player';

const skills = [
  'Hitting Form',
  'Power',
  'Contact',
  'Fielding Form',
  'Glove',
  'Hustle',
  'Throwing Form',
  'Speed',
  'Accuracy',
  'Range',
  'Pitcher Speed',
  'Pitcher Accuracy',
  'Catcher Receiving',
  'Catcher Blocking',
  'Catcher Throwing',
  'General Ability',
];

const evaluationTypesPlayer = ['Pre-Season', 'Post-Season'];
const evaluationTypesTeam = ['All', 'Pre-Season', 'Post-Season'];

const divisions = [
  'Majors',
  'AAA Minor',
  'AA Minor',
  'PeeWee',
  'TeeBall',
  'Major Softball',
  'Teen Softball',
  'Minor Softball',
];

const EvaluationChart: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Player Chart state
  const [playerSeasonYear, setPlayerSeasonYear] = useState<string>(currentYear.toString());
  const [playerSelected, setPlayerSelected] = useState<Player | null>(null);

  // Team Chart state
  const [teamSeasonYear, setTeamSeasonYear] = useState<string>(currentYear.toString());
  const [teamEvaluationType, setTeamEvaluationType] = useState<string>('All');
  const [teamDivision, setTeamDivision] = useState<string>('');
  const [teamSelected, setTeamSelected] = useState<string>('');

  // Data
  const [allTeams, setAllTeams] = useState<{ name: string; division?: string }[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  // Filtered data for Team Chart
  const [filteredTeamDivisions, setFilteredTeamDivisions] = useState<string[]>([]);
  const [filteredTeamTeams, setFilteredTeamTeams] = useState<string[]>([]);

  // Steps
  const teamSteps = ['Season Year', 'Evaluation Type', 'Division', 'Team'];

  // Fetch teams and players on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsData = await getTeams();
        // Deduplicate teams by name, keep division for filtering
        const dedupedTeamsMap = new Map<string, string>();
        teamsData.forEach(t => {
          if (!dedupedTeamsMap.has(t.name)) {
            dedupedTeamsMap.set(t.name, t.division?.name || '');
          }
        });
        const dedupedTeams = Array.from(dedupedTeamsMap.entries()).map(([name, division]) => ({
          name,
          division,
        }));
        setAllTeams(dedupedTeams);

        const playersData = await getPlayers();
        setAllPlayers(playersData);
      } catch (error) {
        console.error('Failed to fetch teams or players', error);
      }
    };
    fetchData();
  }, []);

  // Team Chart: Update filtered divisions and teams when seasonYear or evaluationType changes
  useEffect(() => {
    let divisionsAvailable = divisions;
    let teamsAvailable = allTeams;

    if (teamEvaluationType && teamEvaluationType !== 'All') {
      // For now, do not clear divisions. Just keep all divisions present in team list.
      divisionsAvailable = divisions.filter(d =>
        allTeams.some(t => t.division === d)
      );
      teamsAvailable = allTeams;
    }

    setFilteredTeamDivisions(divisionsAvailable);
    setFilteredTeamTeams(teamsAvailable.map(t => t.name));
    setTeamDivision('');
    setTeamSelected('');
  }, [teamSeasonYear, teamEvaluationType, allTeams]);

  // Team Chart: Update filtered teams when division changes
  useEffect(() => {
    let teamsFiltered = allTeams;
    if (teamDivision) {
      teamsFiltered = allTeams.filter(t => t.division === teamDivision);
    }
    setFilteredTeamTeams(teamsFiltered.map(t => t.name));
    setTeamSelected('');
  }, [teamDivision, allTeams]);

  // Placeholder radar data for player filtered by season year (dummy data)
  const preData = skills.map(() => 70 + (playerSeasonYear ? (parseInt(playerSeasonYear) % 5) : 0));
  const postData = skills.map(() => 80 + (playerSeasonYear ? (parseInt(playerSeasonYear) % 5) : 0));

  // Prepare scatter data points for pre-season and post-season
    const preSeasonPoints = skills.map((skill, index) => ({ x: index, y: preData[index] }));
    const postSeasonPoints = skills.map((skill, index) => ({ x: index, y: postData[index] }));

  // Placeholder team data for RadarChart and ScatterChart
  const teamRadarData = skills.map(() => 75); // placeholder values for team aggregated data
  const teamScatterData = Array.from({ length: Math.min(15, allPlayers.length) }, (_, i) => ({
    x: i % skills.length,
    y: 60 + (i * 2),
    label: allPlayers[i] ? `${allPlayers[i].first_name} ${allPlayers[i].last_name}` : `Player ${i + 1}`,
  }));

  return (
    <Box sx={{ p: 2 }}>
      {/* Player Chart Section */}
      <Typography variant="h5" gutterBottom>
        Player Chart
      </Typography>
      <Box sx={{ width: '25%', mb: 3 }}>
        <Autocomplete
          options={allPlayers}
          getOptionLabel={option => `${option.first_name} ${option.last_name}`}
          value={playerSelected}
          onChange={(_, newValue) => setPlayerSelected(newValue)}
          renderInput={params => <TextField {...params} label="Search Player" fullWidth />}
          clearOnEscape
        />
      </Box>
      {playerSelected && (
        <Grid container spacing={2} sx={{ width: '75%', mb: 4 }}>
          <Grid item xs={3}>
            <TextField
              label="Season Year"
              type="number"
              value={playerSeasonYear}
              onChange={e => setPlayerSeasonYear(e.target.value)}
              fullWidth
              inputProps={{ min: 2000, max: currentYear + 1 }}
            />
          </Grid>
        </Grid>
      )}
      {playerSelected && (
        <Box mb={6}>
          <RadarChart
            height={400}
            series={[
              { label: 'Pre-Season', data: preData },
              { label: 'Post-Season', data: postData },
            ]}
            radar={{
              max: 100,
              metrics: skills,
            }}
          />
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Additional Evaluation Data
            </Typography>
        <ScatterChart
        height={300}
        series={[
            { label: 'Pre-Season', data: preSeasonPoints },
            { label: 'Post-Season', data: postSeasonPoints },
        ]}
        xAxis={[
            {
            scaleType: 'band',
            data: skills.map((skill, index) => index), // numeric indices
            valueFormatter: (value) => skills[value],   // convert index back to label
            },
        ]}
        yAxis={[{ min: 0, max: 100 }]}
        />
          </Box>
        </Box>
      )}

      {/* Team Chart Section */}
      <Typography variant="h5" gutterBottom>
        Team Chart
      </Typography>
      <Grid container spacing={2} sx={{ width: '75%', mb: 4 }}>
        <Grid item xs={3}>
          <TextField
            label="Season Year"
            type="number"
            value={teamSeasonYear}
            onChange={e => setTeamSeasonYear(e.target.value)}
            fullWidth
            inputProps={{ min: 2000, max: currentYear + 1 }}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            select
            label="Evaluation Type"
            value={teamEvaluationType}
            onChange={e => setTeamEvaluationType(e.target.value)}
            fullWidth
          >
            {evaluationTypesTeam.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField
            select
            label="Division"
            value={teamDivision}
            onChange={e => setTeamDivision(e.target.value)}
            fullWidth
          >
            {filteredTeamDivisions.map(d => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField
            select
            label="Team"
            value={teamSelected}
            onChange={e => setTeamSelected(e.target.value)}
            fullWidth
            disabled={filteredTeamTeams.length === 0}
          >
            {filteredTeamTeams.map(t => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Team Chart RadarChart and ScatterChart */}
      {teamSelected && (
        <Box mt={4} sx={{ width: 800 }}>
          <Typography variant="h6" gutterBottom>
            Team Radar Chart
          </Typography>
          <RadarChart
            height={400}
            width={800}
            series={[
              { label: 'Team Aggregate', data: teamRadarData },
            ]}
            radar={{
              max: 100,
              metrics: skills,
            }}
          />
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Team Player Scatter Chart
            </Typography>
            <ScatterChart
              height={400}
              width={800}
              series={[
                { label: 'Players', data: teamScatterData },
              ]}
              xAxis={[
                {
                  scaleType: 'band',
                  data: skills.map((_, index) => index),
                  valueFormatter: (value) => skills[value],
                },
              ]}
              yAxis={[{ min: 0, max: 100 }]}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EvaluationChart;