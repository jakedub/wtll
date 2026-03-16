import React, { useEffect, useState } from 'react';
import { Typography, CircularProgress, Alert, Box } from '@mui/material';
import { Player } from '../../models/player';
import { getPlayerById } from '../../api/players';
import { useParams } from 'react-router-dom';

const PlayerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const currentEval = player?.evaluations?.find(
    (e) => new Date(e.created_at).getFullYear() === currentYear
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPlayerById(Number(id))
      .then((data) => {
        setPlayer(data);
        console.log("Player details loaded successfully.", data)
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load player details.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  if (!player) {
    return (
      <Alert severity="info">No player found.</Alert>
    );
  }

  return (
    <Box
      border={2}
      borderColor="primary.main"
      borderRadius={2}
      p={3}
      sx={{ maxWidth: 500, margin: 'auto', backgroundColor: '#fdf6e3' }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        {player.first_name} {player.last_name}
      </Typography>

      <Box mt={2} mb={1} borderBottom={1} borderColor="primary.main">
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Player Info</Typography>
      </Box>
      <Box mb={2}>
        <Typography><strong>Email:</strong> {player.email}</Typography>
        <Typography><strong>Date of Birth:</strong> {player.date_of_birth}</Typography>
        <Typography><strong>Batting Hand:</strong> {player.batting_hand}</Typography>
        <Typography><strong>Throwing Hand:</strong> {player.throwing_hand}</Typography>
        <Typography><strong>Address Line 1:</strong> {player.address_line_1}</Typography>
        <Typography><strong>Address Line 2:</strong> {player.address_line_2}</Typography>
        <Typography>
          <strong>City/State/Zip:</strong> {player.city}, {player.state} {player.zip_code}
        </Typography>
      </Box>

      <Box mt={2} mb={1} borderBottom={1} borderColor="primary.main">
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Team Info</Typography>
      </Box>
      <Box>
        <Typography><strong>Division:</strong> {player.division ? player.division.name : 'N/A'}</Typography>
        <Typography><strong>Team:</strong> {player.team ? player.team.name : 'N/A'}</Typography>
        <Typography><strong>Jersey Size:</strong> {player.jersey_size}</Typography>
        <Typography><strong>Teammate Request:</strong> {player.teammate_request}</Typography>
        <Typography><strong>Coach Request:</strong> {player.coach_request}</Typography>
        <Typography><strong>Residency Same as Account:</strong> {player.residency_same_as_account ? 'Yes' : 'No'}</Typography>
        <Typography><strong>Interested in Showcase:</strong> {player.interested_in_showcase ? 'Yes' : 'No'}</Typography>

        <Typography>
          <strong>Positions:</strong> {Array.isArray(player.positions)
            ? player.positions.map((p: any) => p.code).join(', ')
            : player.positions}
        </Typography>
        <Typography><strong>Program:</strong> {player.program}</Typography>
        <Typography><strong>Sport:</strong> {player.sport}</Typography>
      </Box>
            <Box mt={2} mb={1} borderBottom={1} borderColor="primary.main">
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>District Info</Typography>
      </Box>
              <Typography><strong>In District:</strong>{player.in_district ? 'Yes' : 'No'}</Typography>
              <Typography><strong>Latitude:</strong>{player.latitude}</Typography>
              <Typography><strong>Longitude:</strong>{player.longitude}</Typography>
              <Box mt={2} mb={1} borderBottom={1} borderColor="primary.main">
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Evaluations</Typography>
    </Box>

    {currentEval ? (
      <Box>
        <Typography><strong>Hitting Form:</strong> {currentEval.hitting_form}</Typography>
        <Typography><strong>Hitting Contact:</strong> {currentEval.hitting_contact}</Typography>
        <Typography><strong>Hitting Power:</strong> {currentEval.hitting_power}</Typography>
        <Typography><strong>Fielding Form:</strong> {currentEval.fielding_form}</Typography>
        <Typography><strong>Fielding Glove:</strong> {currentEval.fielding_glove}</Typography>
        <Typography><strong>Fielding Hustle:</strong> {currentEval.fielding_hustle}</Typography>
        <Typography><strong>Throwing Accuracy:</strong> {currentEval.throwing_accuracy}</Typography>
        <Typography><strong>Throwing Speed:</strong> {currentEval.throwing_speed}</Typography>
        <Typography><strong>Throwing Form:</strong> {currentEval.throwing_form}</Typography>
        <Typography><strong>Pitching Accuracy:</strong> {currentEval.pitching_accuracy}</Typography>
        <Typography><strong>Pitching Speed:</strong> {currentEval.pitching_speed}</Typography>
        <Typography><strong>Catcher Blocking:</strong> {currentEval.catcher_blocking}</Typography>
        <Typography><strong>Catcher Receiving:</strong> {currentEval.catcher_receiving}</Typography>

        <Typography><strong>Total Hitting:</strong> {currentEval.total_hitting}</Typography>
        <Typography><strong>Total Pitching:</strong> {currentEval.total_pitching}</Typography>
        <Typography><strong>Total Catcher:</strong> {currentEval.total_catcher}</Typography>
        <Typography><strong>Total Fielding:</strong> {currentEval.total_fielding}</Typography>
        <Typography><strong>Total Throwing:</strong> {currentEval.total_throwing}</Typography>
        <Typography><strong>Total Overall:</strong> {currentEval.overall_total}</Typography>


      </Box>
    ) : (
      <Typography>No evaluation for current year</Typography>
    )}
    </Box>
  );
};

export default PlayerDetails;