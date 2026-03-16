import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
  Button
} from '@mui/material'
import { useParams } from 'react-router-dom'
import type { Draft } from '../../models/draft'
import type { DraftSelection } from '../../models/draft'
import type { Division } from '../../models/division'
import TeamSelector from './TeamSelector'
import { getDraftState, getAvailablePlayers } from '../../api/draft'
import { getDivision as getDivisions } from '../../api/division'
import { getTeamsByDivision } from '../../api/team'

const DraftDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const draftId = Number(id)

  const [draft, setDraft] = useState<Draft | null>(null)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [selectedDivision, setSelectedDivision] = useState<number | null>(null)
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([])
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<DraftSelection[]>([])
  const [selectedPlayersByTeam, setSelectedPlayersByTeam] = useState<Record<number, DraftSelection[]>>({})
  const [isPitcherFilter, setIsPitcherFilter] = useState(false)
  const [isCatcherFilter, setIsCatcherFilter] = useState(false)

  // Fetch divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      const data = await getDivisions()
      setDivisions(data ?? [])
    }
    fetchDivisions()
  }, [])

  // Fetch draft state
  useEffect(() => {
    if (!draftId) return
    const fetchDraft = async () => {
      const data = await getDraftState(draftId)
      setDraft(data.draft ?? null)
      const selectionsByTeam: Record<number, DraftSelection[]> = {};
      (data.selections ?? []).forEach((sel: DraftSelection) => {
        if (!selectionsByTeam[sel.team_id]) selectionsByTeam[sel.team_id] = []
        selectionsByTeam[sel.team_id].push(sel)
      })
      setSelectedPlayersByTeam(selectionsByTeam)
    }
    fetchDraft()
  }, [draftId])

  // Fetch available players
  useEffect(() => {
    if (!draftId || !selectedDivision) return
    const fetchPlayers = async () => {
      let players = await getAvailablePlayers(draftId, selectedDivision)
      // Sort by overall_total descending
      players = (players ?? []).sort((a, b) => (b.overall_total ?? 0) - (a.overall_total ?? 0))
      setAvailablePlayers(players)
      console.log(`Loaded available players for draft ${draftId} in division ${selectedDivision}:`, players)
    }
    fetchPlayers()
  }, [draftId, selectedDivision])

  // Fetch teams for division
  useEffect(() => {
    if (!selectedDivision) return
    const fetchTeams = async () => {
      const data = await getTeamsByDivision(selectedDivision)
      setTeams(data ?? [])
    }
    fetchTeams()
  }, [selectedDivision])

  const getTeamName = (teamId: number) => teams.find(t => t.id === teamId)?.name ?? `Team ${teamId}`

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, player: DraftSelection) => {
    e.dataTransfer.setData('playerId', player.id.toString())
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, teamId: number) => {
    const playerId = Number(e.dataTransfer.getData('playerId'))
    const player = availablePlayers.find(p => p.id === playerId)
    if (!player) return
    setAvailablePlayers(prev => prev.filter(p => p.id !== playerId))
    setSelectedPlayersByTeam(prev => ({
      ...prev,
      [teamId]: [...(prev[teamId] ?? []), player],
    }))
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

  const removePlayerFromTeam = (teamId: number, player: DraftSelection) => {
    setSelectedPlayersByTeam(prev => ({
      ...prev,
      [teamId]: prev[teamId].filter(p => p.id !== player.id)
    }))
    setAvailablePlayers(prev => [...prev, player])
  }

  if (!draft) return <Box p={3}><Typography>Loading Draft...</Typography></Box>

  // Apply Pitcher/Catcher filters
  const filteredPlayers = availablePlayers.filter(p => {
    if (isPitcherFilter && !(p.total_pitching ?? 0)) return false
    if (isCatcherFilter && !(p.total_catcher ?? 0)) return false
    return true
  })

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">{draft.name} ({draft.year})</Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200, height: 50 }}>
            <InputLabel>Division</InputLabel>
            <Select
              value={selectedDivision ?? ''}
              onChange={e => {
                const val = Number(e.target.value)
                setSelectedDivision(val)
                setSelectedTeams([])
                setSelectedPlayersByTeam({})
                setAvailablePlayers([])
              }}
              sx={{ height: 50 }}
            >
              {divisions.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TeamSelector
            divisionId={selectedDivision ?? 0}
            selectedTeams={selectedTeams}
            setSelectedTeams={setSelectedTeams}
          />
        </Box>
      </Box>

      {selectedTeams.length > 0 && (
        <Grid container spacing={3}>
          {/* Available Players */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, maxHeight: 800, overflow: 'auto' }}>
              <Box mb={2} display="flex" gap={2}>
                <FormControlLabel
                  control={<Checkbox checked={isPitcherFilter} onChange={e => setIsPitcherFilter(e.target.checked)} />}
                  label="Pitcher"
                />
                <FormControlLabel
                  control={<Checkbox checked={isCatcherFilter} onChange={e => setIsCatcherFilter(e.target.checked)} />}
                  label="Catcher"
                />
              </Box>
              <Typography variant="h6">Available Players</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Eval</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell>Pitcher Tier</TableCell>
                    <TableCell>Catcher Tier</TableCell>
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
                      <TableCell>{player.tier_spot}</TableCell>
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
                const teamPlayers = selectedPlayersByTeam[teamId] ?? []
                const pitchersCount = teamPlayers.filter(p => (p.total_pitching ?? 0) > 0).length
                const catchersCount = teamPlayers.filter(p => (p.total_catcher ?? 0) > 0).length

                return (
                  <Grid item xs={12} md={6} key={teamId}>
                    <Paper
                      sx={{ p: 2, minHeight: 300 }}
                      onDrop={e => handleDrop(e, teamId)}
                      onDragOver={handleDragOver}
                    >
                      <Typography variant="h6">{getTeamName(teamId)}</Typography>
                      <Typography variant="body2">Pitchers: {pitchersCount} | Catchers: {catchersCount}</Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teamPlayers.map(player => (
                            <TableRow key={player.id}>
                              <TableCell>{player.name}</TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => removePlayerFromTeam(teamId, player)}
                                >
                                  Undo
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default DraftDetail