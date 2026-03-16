import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  MenuItem,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { getPlayers, importPlayerCSV } from '../../api/players';
import type { Player } from '../../models/player';
import './Players.css';


const PlayerDashboard: React.FC = () => { 
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [newPlayers, setNewPlayers] = useState<Player[]>([]);
  const [failedPlayers, setFailedPlayers] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Player[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const [success, setSuccess] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  // For stacked snackbars
  const [successSnackbar, setSuccessSnackbar] = useState<{
    open: boolean;
    count: number;
  }>({ open: false, count: 0 });
  const [failureSnackbar, setFailureSnackbar] = useState<{
    open: boolean;
    count: number;
  }>({ open: false, count: 0 });

  const [teamFilter, setTeamFilter] = useState('');
  const [lastNameFilter, setLastNameFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');

  const [singlePlayer, setSinglePlayer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    team: '',
    division: '',
    positions: '',
  });

  const navigate = useNavigate();
type BackendResult = any[];
  useEffect(() => {
    const fetchPlayersData = async () => {
      try {
        const data = await getPlayers(); // API call to fetch all players
        setAllPlayers(data);
      } catch (error) {
        console.error("Failed to fetch players:", error);
      }
    };
    fetchPlayersData();
  }, []);

  // Division label mapping
  const DIVISION_LABELS: Record<string, string> = {
    'majors': 'Majors',
    'aaa_minor': 'AAA Minor',
    'aa_minor': 'AA Minor',
    'a_minor': 'A Minor',
    'rookie': 'Rookie',
    // Add more mappings as needed
  };

  // Filtering logic
  const filteredPlayers = allPlayers.filter((player) => {
    const matchesTeam =
      !teamFilter ||
      (player.team && player.team.name.toLowerCase().includes(teamFilter.toLowerCase()));
    const matchesLastName =
      !lastNameFilter ||
      (player.last_name && player.last_name.toLowerCase().includes(lastNameFilter.toLowerCase()));
    const matchesDivision =
      !divisionFilter ||
      (player.division && player.division.name.toLowerCase().includes(divisionFilter.toLowerCase()));
    return matchesTeam && matchesLastName && matchesDivision;
  });
  // Use division keys for filtering and mapping
  const uniqueDivisions = Array.from(new Set(allPlayers.map(p => p.division?.name))).filter(Boolean);

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  const normalizeResults = (backendRows: BackendResult): Player[] =>
    backendRows.map((row) => ({
      id: row.id ?? null,
      player_id: row.player_id ?? null,
      first_name: row.first_name ?? "",
      last_name: row.last_name ?? "",
      email: row.email ?? "",
      address_line_1: row.address_line_1 ?? row.address ?? "",
      address_line_2: row.address_line_2 ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      zip_code: row.zip_code ?? row.zip ?? "",
      date_of_birth: row.date_of_birth ?? null,
      status: row.status ?? "",
      error: row.error ?? "",
      jersey_size: row.jersey_size ?? "",
      teammate_request: row.teammate_request ?? "",
      coach_request: row.coach_request ?? "",
      batting_hand: row.batting_hand ?? "",
      throwing_hand: row.throwing_hand ?? "",
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
      district: row.district ?? "",
      residency_same_as_account: row.residency_same_as_account ?? "",
      interested_in_showcase: row.interested_in_showcase ?? "",
      team: row.team ?? null,
      division: row.division ?? null,
      school_name: row.school_name ?? "",
      positions: Array.isArray(row.positions) ? row.positions : [],
      // Add required Player fields with default values:
      sport: row.sport ?? "",
      program: row.program ?? "",
      is_allstar: row.is_allstar ?? false,
      is_showcase: row.is_showcase ?? false,
      is_eligible: row.is_eligible ?? false
    }));

  // Handle CSV upload and update player lists accordingly
  const handleUpload = async () => {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    try {
      const data = await importPlayerCSV(file);
      console.log("[CSV Upload] Backend response:", data);
      // Normalize inserted and updated players
      const inserted = normalizeResults(data.inserted || []);
      const updated = normalizeResults(data.updated || []);
      // Set newPlayers to inserted
      setNewPlayers(inserted);
      // Set failedPlayers to failures
      setFailedPlayers(data.failures || []);
      // Update allPlayers to include inserted and updated players (replace by id if exists, else add)
      setAllPlayers(prevPlayers => {
        // Create a map of id to player for quick replacement
        const playerMap = new Map(prevPlayers.map(p => [p.id, p]));
        // Insert or update inserted players
        inserted.forEach(player => {
          if (player.id != null) {
            playerMap.set(player.id, player);
          }
        });
        // Insert or update updated players
        updated.forEach(player => {
          if (player.id != null) {
            playerMap.set(player.id, player);
          }
        });
        return Array.from(playerMap.values());
      });
      // Keep existing logging and snackbar logic
      setRows(normalizeResults(data.results || []));
      setFailures([]);
      setSuccess([]);
    } catch (err) {
      console.error("CSV Upload error:", err);
      setSnackbar({ open: true, message: "Error uploading CSV.", severity: "error" });
    }
    setLoading(false);
  };

  // Handle single player input changes
  const handleSinglePlayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSinglePlayer(prev => ({ ...prev, [name]: value }));
  };

  // Handle single player form submission
  const handleSinglePlayerSubmit = async () => {
    try {
      // Construct player object
      const playerToAdd = {
        first_name: singlePlayer.first_name.trim(),
        last_name: singlePlayer.last_name.trim(),
        email: singlePlayer.email.trim(),
        team: singlePlayer.team.trim(),
        division: singlePlayer.division.trim(),
        positions: singlePlayer.positions.split(',').map(p => p.trim()).filter(Boolean).map(code => ({ code })),
      };

      // Validate minimal fields
      if (!playerToAdd.first_name || !playerToAdd.last_name || !playerToAdd.email) {
        alert('First name, Last name, and Email are required.');
        return;
      }

      // Assuming an API endpoint to add a single player
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerToAdd),
      });
      if (!response.ok) {
        throw new Error(`Failed to add player with status ${response.status}`);
      }
      const addedPlayer = await response.json();
      setNewPlayers(prev => [...prev, addedPlayer]);
      setAllPlayers(prev => [...prev, addedPlayer]);
      setSinglePlayer({
        first_name: '',
        last_name: '',
        email: '',
        team: '',
        division: '',
        positions: '',
      });
      console.log('Single player added:', addedPlayer);
    } catch (error) {
      console.error('Failed to add single player:', error);
      alert('Failed to add player. See console for details.');
    }
  };

  // Handle row click navigation
  const handleRowClick = (playerId: number) => {
    navigate(`/players/${playerId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Players Dashboard
      </Typography>

      {/* Section 1: New Player */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" gutterBottom>
          New Player
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Upload CSV
            </Typography>
            <input
              title="Upload CSV file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ marginBottom: 8 }}
              data-testid="csv-upload-input"
            />
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file}
              data-testid="csv-upload-button"
            >
              Upload
            </Button>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Add Single Player
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="first_name"
                  value={singlePlayer.first_name}
                  onChange={handleSinglePlayerChange}
                  fullWidth
                  data-testid="singleplayer-firstname"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="last_name"
                  value={singlePlayer.last_name}
                  onChange={handleSinglePlayerChange}
                  fullWidth
                  data-testid="singleplayer-lastname"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={singlePlayer.email}
                  onChange={handleSinglePlayerChange}
                  fullWidth
                  data-testid="singleplayer-email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Team"
                  name="team"
                  value={singlePlayer.team}
                  onChange={handleSinglePlayerChange}
                  fullWidth
                  data-testid="singleplayer-team"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Division"
                  name="division"
                  value={singlePlayer.division}
                  onChange={handleSinglePlayerChange}
                  fullWidth
                  data-testid="singleplayer-division"
                >
                  {uniqueDivisions.map(division => {
                    if (!division) return null;
                    return (
                      <MenuItem key={division} value={division}>
                        {DIVISION_LABELS[division as keyof typeof DIVISION_LABELS] || division}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Positions (comma separated codes)"
                  name="positions"
                  value={singlePlayer.positions}
                  onChange={handleSinglePlayerChange}
                  fullWidth
                  data-testid="singleplayer-positions"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSinglePlayerSubmit}
                  data-testid="singleplayer-submit"
                >
                  Add Player
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Section 2: Insert Results */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" gutterBottom>
          Insert Results
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Successfully Inserted Players
          </Typography>
          {newPlayers.length === 0 ? (
            <Typography>No new players inserted yet.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Division</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newPlayers.map((player) => (
                  <TableRow
                    key={player.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(player.id)}
                    data-testid={`inserted-player-row-${player.id}`}
                  >
                    <TableCell>{player.first_name}</TableCell>
                    <TableCell>{player.last_name}</TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>{player.team ? player.team.name : 'N/A'}</TableCell>
                    <TableCell>{player.division ? player.division.name : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Failed Players
          </Typography>
          {failedPlayers.length === 0 ? (
            <Typography>No failed player imports.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failedPlayers.map((fail, index) => (
                  <TableRow key={index}>
                    <TableCell>{JSON.stringify(fail.data)}</TableCell>
                    <TableCell>{fail.reason || 'Unknown'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>

      {/* Section 3: See All Players */}
      <Box>
        <Typography variant="h5" gutterBottom>
          See All Players
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Filter by team"
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="player-filter-input"
            data-testid="filter-team"
          />
          <TextField
            label="Filter by last name"
            value={lastNameFilter}
            onChange={e => setLastNameFilter(e.target.value)}
            className="player-filter-input"
            data-testid="filter-lastname"
          />
          <TextField
            select
            label="Filter by division"
            value={divisionFilter}
            onChange={e => setDivisionFilter(e.target.value)}
            className="player-filter-input"
            sx={{ minWidth: 200 }}
            data-testid="filter-division"
          >
            <MenuItem value="">
              All
            </MenuItem>
            {uniqueDivisions.map(division => {
              if (!division) return null;
              return (
                <MenuItem key={division} value={division}>
                  {DIVISION_LABELS[division as keyof typeof DIVISION_LABELS] || division}
                </MenuItem>
              );
            })}
          </TextField>
          <Button
            onClick={() => {
              setTeamFilter('');
              setLastNameFilter('');
              setDivisionFilter('');
            }}
            style={{
              height: 40,
              padding: '0 16px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
              marginLeft: 8,
              fontSize: '1rem'
            }}
            className="player-filter-input"
            data-testid="reset-filters"
          >
            Reset Filters
          </Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Division</TableCell>
              <TableCell>School Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPlayers.map((player) => (
              <TableRow
                key={player.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(player.id)}
                data-testid={`all-player-row-${player.id}`}
              >
                <TableCell>{player.first_name}</TableCell>
                <TableCell>{player.last_name}</TableCell>
                <TableCell>{player.email}</TableCell>
                <TableCell>{player.team ? player.team.name : 'N/A'}</TableCell>
                <TableCell>{player.division ? player.division.name : 'N/A'}</TableCell>
                <TableCell>{player.school_name || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

export default PlayerDashboard;