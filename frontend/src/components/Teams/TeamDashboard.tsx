// src/components/Teams/TeamDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Grid, TextField, Button, ListItem, CardContent, Card, List, ListItemText, CardHeader } from '@mui/material';
import { getTeams } from '../../api/team';
import { getEvaluations } from '../../api/evaluation';
import { Team } from '../../models/team';
import { Evaluation } from '../../models/evaluation';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import { DIVISION_NAMES } from '../../constants/divisions';
const TeamDashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [seasonYear, setSeasonYear] = useState<number | 'All'>('All');
  const [evaluationType, setEvaluationType] = useState<string | 'All'>('All');
  const [division, setDivision] = useState<string | 'All'>('All');
  const [selectedTeam, setSelectedTeam] = useState<string | 'All'>('All');

  useEffect(() => {
    getTeams().then(setTeams);
    getEvaluations().then(setEvaluations);
  }, []);

  const filteredEvaluations = evaluations.filter((evalItem) => {
    return (
      (seasonYear === 'All' || evalItem.season_year === seasonYear) &&
      (evaluationType === 'All' || evalItem.evaluation_type === evaluationType) &&
      (division === 'All' || evalItem.player.division?.name === division) &&
      (selectedTeam === 'All' || evalItem.player.team?.name === selectedTeam)
    );
  });

  // Aggregate team stats for Radar chart grouped by Division - Team
  const teamRadarData = Object.entries(
    filteredEvaluations.reduce((acc: Record<string, Evaluation[]>, evalItem) => {
      const divName = evalItem.player.division?.name || 'Unknown';
      const teamName = evalItem.player.team?.name || 'Unknown';
      const key = `${divName} - ${teamName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(evalItem);
      return acc;
    }, {})
  ).map(([label, teamEvals]) => {
    const avg = (arr: (number | undefined)[]) =>
      arr.filter((n) => n !== undefined).reduce((a, b) => (a || 0) + (b || 0), 0) /
      (arr.filter((n) => n !== undefined).length || 1);

    return {
      label,
      data: [
        avg(teamEvals.map((e) => e.hitting_form)),
        avg(teamEvals.map((e) => e.hitting_power)),
        avg(teamEvals.map((e) => e.hitting_contact)),
        avg(teamEvals.map((e) => e.fielding_form)),
        avg(teamEvals.map((e) => e.fielding_glove)),
        avg(teamEvals.map((e) => e.fielding_hustle)),
        avg(teamEvals.map((e) => e.throwing_form)),
        avg(teamEvals.map((e) => e.throwing_speed)),
        avg(teamEvals.map((e) => e.throwing_accuracy)),
        avg(teamEvals.map((e) => e.pitching_speed)),
        avg(teamEvals.map((e) => e.pitching_accuracy)),
        avg(teamEvals.map((e) => e.catcher_receiving)),
        avg(teamEvals.map((e) => e.catcher_blocking)),
      ],
    };
  });

  // Scatter chart data per player
  const scatterData = filteredEvaluations.map((e) => ({
    x: e.player.first_name + ' ' + e.player.last_name,
    y: e.total_hitting || 0,
  }));

  const divisions = Array.from(new Set(evaluations.map((e) => e.player.division?.name).filter(Boolean)));
  const teamNames = Array.from(new Set(teams.map((t) => t.name)));
  

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Team Dashboard</Typography>
        <Button
          variant="contained"
          color="primary"
          href="/teams/create"
        >
          Create Team
        </Button>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" className="team-dashboard" mb={2}>
        {Object.entries(
          teams
            .filter(team => team.year === 2026)
            .reduce<Record<string, Team[]>>((acc, team) => {
              const div = team.division?.name || 'Unknown';
              if (!acc[div]) acc[div] = [];
              acc[div].push(team);
              return acc;
            }, {})
        ).map(([divName, teamsInDiv]) => (
          <Card key={divName} variant="outlined" sx={{ width: '30%', mr: 2 }}>
            <CardHeader
              title={DIVISION_NAMES[divName] || divName}
              sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
            />
            <CardContent>
              <List dense>
                {teamsInDiv.map((team) => (
                  <ListItem key={team.id} disableGutters>
                    <ListItemText
                      primary={team.name}
                      secondary={team.coach ? `Coach: ${team.coach}` : null}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        Team Statistics
      </Typography> */}

      {/* Filters */}
      {/* <Grid container spacing={2} mb={4}>
        <Grid item xs={3}>
          <TextField
            select
            label="Season Year"
            placeholder="All"
            fullWidth
            value={seasonYear}
            onChange={(e) => setSeasonYear(e.target.value as number | 'All')}
          >
            <MenuItem value="All">All</MenuItem>
            {Array.from(new Set(evaluations.map((e) => e.season_year))).map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={3}>
          <TextField
            select
            label="Evaluation Type"
            placeholder="All"
            fullWidth
            value={evaluationType}
            onChange={(e) => setEvaluationType(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="pre">Pre-Season</MenuItem>
            <MenuItem value="post">Post-Season</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={3}>
          <TextField
            select
            label="Division"
            placeholder="All"
            fullWidth
            value={division}
            onChange={(e) => setDivision(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
                {divisions
                .filter((div): div is string => Boolean(div)) // ensures div is a string
                .map((div) => (
                    <MenuItem key={div} value={div}>{DIVISION_NAMES[div] || div}</MenuItem>
                ))
                }
          </TextField>
        </Grid>

        <Grid item xs={3}>
          <TextField
            select
            label="Team"
            placeholder="All"
            fullWidth
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            {teamNames.map((team) => (
              <MenuItem key={team} value={team}>{team}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid> */}

      {/* Charts */}
      {/* <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Team Radar Chart</Typography>
          <RadarChart
            height={400}
            series={teamRadarData}
            radar={{
              max: 5,
              metrics: [
                'Hitting Form', 'Power', 'Contact',
                'Fielding Form', 'Glove', 'Hustle',
                'Throwing Form', 'Speed', 'Accuracy',
                'Pitching Speed', 'Pitching Accuracy',
                'Catcher Receiving', 'Catcher Blocking', 'Catcher Throwing',
                'General Ability'
              ]
            }}
          />
        </Grid> */}

        {/* Team list grouped by divisions on the right */}
        {/* <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Teams by Division</Typography>
          <Box>
            {['majors', 'aaa_minor', 'aa_minor'].map((divKey) => {
              const teamsInDivision = teams.filter(t => t.division?.name === divKey);
              if (teamsInDivision.length === 0) return null;
              return (
                <Box key={divKey} mb={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {DIVISION_NAMES[divKey]}
                  </Typography>
                  {teamsInDivision.map((team) => (
                    <Box key={team.id} mb={0.5}>
                      <a href={`/teams/${team.id}`} style={{ textDecoration: 'none', color: '#1976d2' }}>
                        {team.name}
                      </a>
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        </Grid> */}
      {/* </Grid> */}
    </Box>
  );
};

export default TeamDashboard;