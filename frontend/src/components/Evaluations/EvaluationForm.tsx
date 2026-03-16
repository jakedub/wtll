import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, Divider } from '@mui/material';
import { getPlayers } from '../../api/players';
import { Player } from '../../models/player';
import './Evaluations.css';

const EvaluationCard: React.FC<{ player?: Player }> = ({ player }) => {
  const showPositions =
    player?.division?.name === 'Majors' || player?.division?.name === 'AAA Minor';

  return (
    <Paper sx={{ p: 2, border: '1px solid #000', mb: 2, position: 'relative', width: '100%' }}>
      <Box sx={{ px: '10px' }}>
        <Typography variant="h6" align="center">
          WASHINGTON TOWNSHIP LITTLE LEAGUE
        </Typography>

        <Typography align="right">
          <strong>Evaluator:______________</strong>
        </Typography>

        <Typography>
          <strong>Division:</strong> {player?.division?.name || ''}
        </Typography>

        <Typography>
          <strong>Player:</strong>{' '}
          {player ? `${player.first_name} ${player.last_name}` : '_________________'}
        </Typography>

        <Typography>
          <strong>Date of Birth:</strong>{' '}
          {player?.date_of_birth
            ? new Date(player.date_of_birth).toLocaleDateString()
            : '__________'}
        </Typography>

        <Divider className="evalDiv" />

        <Box sx={{ display: 'flex', mt: 1, mb: 1, gap: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Typography>
              <strong>Batting Hand:</strong>
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
              <Typography>L</Typography>
              <Typography>R</Typography>
              <Typography>B</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Typography>
              <strong>Throwing Hand:</strong>
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
              <Typography>L</Typography>
              <Typography>R</Typography>
            </Box>
          </Box>

          {showPositions && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <Typography>
                <strong>Position Interest</strong>
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                <Typography>Pitcher</Typography>
                <Typography>Catcher</Typography>
                <Typography>Both</Typography>
                <Typography>None</Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Divider className="evalDiv" sx={{ my: 1 }} />

        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Typography sx={{ fontWeight: 'bold' }}>Hitting</Typography>
            <Typography>Form: _______</Typography>
            <Typography>Power: _______</Typography>
            <Typography>Contact: _______</Typography>
          </Grid>

          <Grid item xs={4}>
            <Typography sx={{ fontWeight: 'bold' }}>Fielding</Typography>
            <Typography>Form: _______</Typography>
            <Typography>Glove: _______</Typography>
            <Typography>Hustle: _______</Typography>
          </Grid>

          <Grid item xs={4}>
            <Typography sx={{ fontWeight: 'bold' }}>Throwing</Typography>
            <Typography>Form: _______</Typography>
            <Typography>Speed: _______</Typography>
            <Typography>Accuracy: _______</Typography>
          </Grid>
        </Grid>

        {showPositions && (
          <>
            <Divider className="evalDiv" sx={{ my: 1 }} />

            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography sx={{ fontWeight: 'bold' }}>Pitcher</Typography>
                <Typography>Speed: _______</Typography>
                <Typography>Accuracy: _______</Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography sx={{ fontWeight: 'bold' }}>Catcher</Typography>
                <Typography>Receiving: _______</Typography>
                <Typography>Blocking: _______</Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography sx={{ fontWeight: 'bold' }}>General Abilities:</Typography>
              </Grid>
            </Grid>
          </>
        )}

        <Typography
          sx={{ position: 'absolute', bottom: 8, right: 8, fontSize: '0.75rem' }}
        >
          Rating: 1 to 5
        </Typography>
      </Box>
    </Paper>
  );
};

const EvaluationForm: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showBlank, setShowBlank] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await getPlayers();
        setPlayers(data);
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };

    fetchPlayers();
  }, []);

  const handlePrint = () => {
    setShowBlank(false);
    setTimeout(() => window.print(), 100);
  };

  let playerGroups: (Player | undefined)[][] = [];

  if (showBlank) {
    playerGroups = [[undefined, undefined]];
  } else {
    const divisionMap = new Map<string, Player[]>();

    players
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
      .forEach((player) => {
        const divisionName = player.division?.name || 'Unknown';

        if (divisionName === 'TeeBall') return;

        if (!divisionMap.has(divisionName)) {
          divisionMap.set(divisionName, []);
        }

        divisionMap.get(divisionName)!.push(player);
      });

    [...divisionMap.keys()].sort().forEach((divisionName) => {
      const playersInDivision = divisionMap.get(divisionName)!;

      for (let i = 0; i < playersInDivision.length; i += 2) {
        playerGroups.push(playersInDivision.slice(i, i + 2));
      }
    });
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, '@media print': { display: 'none' } }}>

        {!showBlank && (
          <>
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
              onClick={handlePrint}
            >
              Print Evaluations
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowBlank(true)}
            >
              Show Blank Evaluations
            </Button>
          </>
        )}

        {showBlank && (
          <>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mr: 2 }}
              onClick={() => setShowBlank(false)}
            >
              Show Player Evaluations
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={() => window.print()}
            >
              Print Blank Evaluations
            </Button>
          </>
        )}

      </Box>

      <Box className="print-area" sx={{ '@media print': { display: 'block' } }}>
        {playerGroups.map((group, index) => (
          <Box
            key={index}
            sx={{
              mb: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pageBreakAfter: index < playerGroups.length - 1 ? 'always' : 'auto',
              '@media print': {
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }
            }}
          >
            {group.map((player, idx) => (
              <Box key={idx} sx={{ width: '100%', mb: 8 }}>
                <EvaluationCard player={player} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default EvaluationForm;