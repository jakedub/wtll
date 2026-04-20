import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, Grid, Paper,
  Checkbox, FormControlLabel, Button, Popover,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { useParams } from 'react-router-dom';
import type { Draft, DraftSelection } from '../../models/draft';
import type { Division } from '../../models/division';
import TeamSelector from './TeamSelector';
import { getDraftState, getAvailablePlayers, draftPlayers, undoDraftPlayers, exportDraftCSV, markDraftComplete, saveDraftTeams } from '../../api/draft';
import { getDivision as getDivisions } from '../../api/division';
import { getTeamsByDivision } from '../../api/team';
import { Chip, Tooltip } from '@mui/material';

const DraftDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const draftId = Number(id);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
  const [teams, setTeams] = useState<{ id: number; name: string; coach?: string; assistant_coach?: string;}[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<DraftSelection[]>([]);
  const [selectedPlayersByTeam, setSelectedPlayersByTeam] = useState<Record<number, DraftSelection[]>>({});
  const [isPitcherFilter, setIsPitcherFilter] = useState(false);
  const [isCatcherFilter, setIsCatcherFilter] = useState(false);
  const [draftStats, setDraftStats] = useState<{ totalPlayers: number; runningAverage: number }>({ totalPlayers: 0, runningAverage: 0 });
  const [draftError, setDraftError] = useState<string | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState<HTMLButtonElement | null>(null);


  // Fetch divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      const data = await getDivisions();
      setDivisions(data ?? []);
    };
    fetchDivisions();
  }, []);

  // Sync isComplete from loaded draft
  useEffect(() => {
    if (draft) setIsComplete(draft.is_complete ?? false);
  }, [draft]);

  useEffect(() => {
    if (!draftId || selectedTeams.length === 0) return;
    saveDraftTeams(draftId, selectedTeams);
  }, [selectedTeams]);
  // Compute draft stats whenever selections change
  useEffect(() => {
    if (!selectedDivision || !draft) {
      setDraftStats({ totalPlayers: 0, runningAverage: 0 });
      return;
    }
    const playersInDivision = Object.entries(selectedPlayersByTeam)
      .filter(([teamId]) => selectedTeams.includes(Number(teamId)))
      .flatMap(([_, players]) => players);

    const totalPlayers = playersInDivision.length;
    const sumOverall = playersInDivision.reduce((acc, p) => acc + (p.overall_total ?? 0), 0);
    const runningAverage = totalPlayers > 0 ? sumOverall / totalPlayers : 0;

    setDraftStats({ totalPlayers, runningAverage });
  }, [selectedPlayersByTeam, selectedDivision, selectedTeams, draft]);

  // Fetch draft state
const fetchAndSetDraftState = async () => {
  if (!draftId) return;
  const data = await getDraftState(draftId);
  setDraft(data.draft ?? null);

  // Restore selections — keys come back as strings from JSON
  const rawByTeam: Record<string, DraftSelection[]> = data.selections_by_team ?? {};
  const selectionsByTeam: Record<number, DraftSelection[]> = {};
  Object.entries(rawByTeam).forEach(([key, players]) => {
    selectionsByTeam[Number(key)] = players as DraftSelection[];
  });
  setSelectedPlayersByTeam(selectionsByTeam);

  // Restore division and selected teams directly from saved model state
  if (data.draft?.division_id) {
    setSelectedDivision(data.draft.division_id);
  }
  if (data.selected_teams?.length) {
    setTeams(data.selected_teams);
    setSelectedTeams(data.selected_team_ids ?? []);
  }
};

  useEffect(() => {
    fetchAndSetDraftState();
  }, [draftId]);

  // Fetch available players
  useEffect(() => {
    if (!draftId || !selectedDivision) return;
    const fetchPlayers = async () => {
      let players = await getAvailablePlayers(draftId, selectedDivision);
      players = (players ?? []).sort((a, b) => (b.overall_total ?? 0) - (a.overall_total ?? 0));
      setAvailablePlayers(players);
    };
    fetchPlayers();
  }, [draftId, selectedDivision]);

  // Fetch teams for division
  useEffect(() => {
    if (!selectedDivision) return;
    const fetchTeams = async () => {
      const data = await getTeamsByDivision(selectedDivision);
      setTeams(data ?? []);
    };
    fetchTeams();
  }, [selectedDivision]);

  const getTeamName = (teamId: number) => teams.find(t => t.id === teamId)?.name ?? `Team ${teamId}`;
  const getCoachName = (teamId: number) => teams.find(t => t.id === teamId)?.coach ?? '';
  const getAssistantCoachName = (teamId: number) => teams.find(t => t.id === teamId)?.assistant_coach ?? '';

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, player: DraftSelection) => {
    e.dataTransfer.setData('playerId', player.id.toString());
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, teamId: number) => {
    const playerId = Number(e.dataTransfer.getData('playerId'));
    const player = availablePlayers.find(p => p.id === playerId);
    if (!player || !selectedDivision || !draftId) return;

    const prevAvailable = availablePlayers;
    const prevByTeam = selectedPlayersByTeam;

    setAvailablePlayers(prev => prev.filter(p => p.id !== playerId));
    setSelectedPlayersByTeam(prev => ({
      ...prev,
      [teamId]: [...(prev[teamId] ?? []), player],
    }));

    try {
      await draftPlayers(draftId, teamId, selectedDivision, [playerId]);
      setDraftError(null);
    } catch (error) {
      console.error('Failed to add player to team:', error);
      setAvailablePlayers(prevAvailable);
      setSelectedPlayersByTeam(prevByTeam);
      setDraftError(`Couldn't draft ${player.name} — please try again.`);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // Remove player
  const removePlayerFromTeam = async (teamId: number, player: DraftSelection) => {
    if (!draftId || !selectedDivision) return;

    const prevAvailable = availablePlayers;
    const prevByTeam = selectedPlayersByTeam;

    setSelectedPlayersByTeam(prev => ({
      ...prev,
      [teamId]: prev[teamId].filter(p => p.id !== player.id),
    }));
    setAvailablePlayers(prev =>
      [...prev, player].sort((a, b) => (b.overall_total ?? 0) - (a.overall_total ?? 0))
    );

    try {
      await undoDraftPlayers(draftId, teamId, selectedDivision, [player.id]);
      setDraftError(null);
    } catch (error) {
      console.error('Failed to remove player:', error);
      setAvailablePlayers(prevAvailable);
      setSelectedPlayersByTeam(prevByTeam);
      setDraftError(`Couldn't remove ${player.name} — please try again.`);
    }
  };

  const handleMarkComplete = async () => {
    if (!draftId) return;
    setCompleting(true);
    try {
      await markDraftComplete(draftId);
      setIsComplete(true);
      setCompleteModalOpen(false);
    } catch (error) {
      console.error('Failed to mark draft complete:', error);
      setDraftError('Could not mark draft complete — please try again.');
    } finally {
      setCompleting(false);
    }
  };

  // Compute local team balance
  const localTeamBalance: Record<number, number> = {};
  Object.entries(selectedPlayersByTeam).forEach(([teamIdStr, players]) => {
    const teamId = Number(teamIdStr);
    let totalScore = 0;
    players.forEach(player => {
      if (typeof player.tier_spot === 'number') totalScore += player.tier_spot;
      if (typeof player.pitcher_tier === 'number') totalScore += player.pitcher_tier;
      if (typeof player.catcher_tier === 'number') totalScore += player.catcher_tier;
    });
    localTeamBalance[teamId] = totalScore;
  });

  if (!draft) return <Box p={3}><Typography>Loading Draft...</Typography></Box>;

  const filteredPlayers = availablePlayers.filter(p => {
    if (isPitcherFilter && !(p.total_pitching ?? 0)) return false;
    if (isCatcherFilter && !(p.total_catcher ?? 0)) return false;
    return true;
  });

  const filterLabel = selectedDivision
    ? `${divisions.find(d => d.id === selectedDivision)?.name ?? 'Division'} · ${selectedTeams.length} team${selectedTeams.length !== 1 ? 's' : ''}`
    : 'Division & Teams';

  return (
    <Box p={2}>

      {/* Error banner */}
      {draftError !== null && (
        <Box
          mb={1} px={2} py={1}
          sx={{ background: '#FCEBEB', border: '1px solid #F09595', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="body2" sx={{ color: '#A32D2D' }}>{draftError}</Typography>
          <Button size="small" sx={{ color: '#A32D2D', minWidth: 0 }} onClick={() => setDraftError(null)}>✕</Button>
        </Box>
      )}

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">{draft.name} ({draft.year})</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Button variant="outlined" size="small" onClick={() => exportDraftCSV(draftId)}>
            Export xlsx
          </Button>
          <Button
            variant="contained"
            size="small"
            color={isComplete ? 'success' : 'primary'}
            disabled={isComplete}
            onClick={() => setCompleteModalOpen(true)}
          >
            {isComplete ? 'Draft Complete' : 'Mark Complete'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={e => setFilterAnchor(e.currentTarget)}
          >
            {filterLabel}
          </Button>
        </Box>
      </Box>

      {/* Division & Team popover */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { p: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 260 } }}
      >
        <FormControl size="small" fullWidth>
          <InputLabel>Division</InputLabel>
          <Select
            value={selectedDivision ?? ''}
            onChange={e => {
              const val = Number(e.target.value);
              setSelectedDivision(val);
              setSelectedTeams([]);
              setSelectedPlayersByTeam({});
              setAvailablePlayers([]);
            }}
          >
            {divisions.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TeamSelector
          divisionId={selectedDivision ?? 0}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
        />
      </Popover>

      {selectedTeams.length > 0 && (
        <Grid container spacing={2}>

          {/* Available Players */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 2,
              maxHeight: 800,
              overflow: 'auto',
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '4px' },
            }}>
              <Box mb={1} display="flex" gap={1}>
                <Chip
                  label="Pitcher"
                  size="small"
                  clickable
                  color={isPitcherFilter ? 'primary' : 'default'}
                  onClick={() => setIsPitcherFilter(p => !p)}
                />
                <Chip
                  label="Catcher"
                  size="small"
                  clickable
                  color={isCatcherFilter ? 'primary' : 'default'}
                  onClick={() => setIsCatcherFilter(p => !p)}
                />
              </Box>

              <Typography variant="subtitle2" mb={0.5}>
                Available Players ({filteredPlayers.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Ovr</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell>P</TableCell>
                    <TableCell>C</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlayers.map(player => (
                    <TableRow
                      key={player.id}
                      draggable
                      onDragStart={e => handleDragStart(e, player)}
                      hover
                      sx={{ cursor: 'grab' }}
                    >
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.overall_total ?? ''}</TableCell>
                      <TableCell>{player.tier_spot ?? ''}</TableCell>
                      <TableCell>{player.pitcher_tier ?? ''}</TableCell>
                      <TableCell>{player.catcher_tier ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Team Boards */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {selectedTeams.map(teamId => {
                const teamPlayers = selectedPlayersByTeam[teamId] ?? [];
                const pitchersCount = teamPlayers.filter(p => (p.total_pitching ?? 0) > 0).length;
                const catchersCount = teamPlayers.filter(p => (p.total_catcher ?? 0) > 0).length;
                const balance = localTeamBalance[teamId] ?? 0;
                const teamCount = teamPlayers.length;

                const balances = selectedTeams.map(tid => localTeamBalance[tid] ?? 0);
                const avgBalance = balances.reduce((acc, val) => acc + val, 0) / (balances.length || 1);

                let bgColor = 'white';
                if (balance < avgBalance * 0.9) bgColor = '#ffe5e5';
                else if (balance > avgBalance * 1.1) bgColor = '#e5f7ff';

                const coachName = getCoachName(teamId);
                const assistantCoachName = getAssistantCoachName(teamId);


                return (
                  <Grid item xs={12} md={6} key={teamId}>
                    <Paper
                      sx={{
                        p: 2,
                        minHeight: 300,
                        backgroundColor: bgColor,
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '4px' },
                      }}
                      onDrop={e => handleDrop(e, teamId)}
                      onDragOver={handleDragOver}
                    >
                      <Typography variant="subtitle1" fontWeight={500}>
                        {getTeamName(teamId)} | {teamCount} players
                      </Typography>
                      {coachName && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          {coachName}
                        </Typography>
                      )}
                      {assistantCoachName && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          {assistantCoachName}
                        </Typography>
                      )}
                      <Typography variant="body2" mb={1}>
                        P: {pitchersCount} | C: {catchersCount} | Bal: {balance.toFixed(1)} | RA: {draftStats.runningAverage.toFixed(1)}
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell>Tier</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teamPlayers.map(player => (
                            <TableRow key={player.id}>
                              <TableCell>{player.name}</TableCell>
                              <TableCell>{player.tier_spot ?? ''}</TableCell>
                              <TableCell>
                                <Button size="small" color="error" onClick={() => removePlayerFromTeam(teamId, player)}>
                                  Undo
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Mark complete confirmation */}
      <Dialog open={completeModalOpen} onClose={() => setCompleteModalOpen(false)}>
        <DialogTitle>Mark Draft Complete?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will lock the draft. You won't be able to add or remove players after confirming.
            Make sure all teams are finalized before proceeding.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteModalOpen(false)} disabled={completing}>
            Cancel
          </Button>
          <Button
            onClick={handleMarkComplete}
            variant="contained"
            color="error"
            disabled={completing}
          >
            {completing ? 'Saving...' : 'Confirm Complete'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default DraftDetail;