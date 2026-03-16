// src/components/Shared/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { getPlayers, getPlayerById, getDivisionCounts } from '../../api/players';
import type { Player } from '../../models/player';

interface CardItem {
  title: string;
  description: string;
  imageUrl: string;
  route: string;
}

interface DivisionCount {
  division: string;
  count: number;
}

const cards: CardItem[] = [
  {
    title: 'Address Validation',
    description: 'Upload CSVs and validate player addresses on the map',
    imageUrl: 'https://picsum.photos/400/200?random=1',
    route: '/address-validation'
  },
  {
    title: 'Players Dashboard',
    description: 'View and manage all registered players',
    imageUrl: 'https://picsum.photos/400/200?random=2',
    route: '/players'
  },
  {
    title: 'Evaluation Dashboard',
    description: 'Review and submit player evaluations',
    imageUrl: 'https://picsum.photos/400/200?random=3',
    route: '/evaluations'
  },
  {
    title: 'Draft Dashboard',
    description: 'Review and Create Drafts',
    imageUrl: 'https://picsum.photos/400/200?random=4',
    route: '/draft-dashboard'
  }
];

const Dashboard: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [divisionCounts, setDivisionCounts] = useState<DivisionCount[]>([]);

useEffect(() => {
    const fetchPlayersData = async () => {
        try {
        const data = await getPlayers(); // API call to fetch all players
        setPlayers(data);
        } catch (error) {
        console.error("Failed to fetch players:", error);
        }
    };

    fetchPlayersData();
}, []);

useEffect(() => {
  const fetchCounts = async () => {
    const data = await getDivisionCounts();
    setDivisionCounts(data);
  };

  fetchCounts();
}, []);

return (
    <><Box sx={{ p: 4 }}>

        <Grid container spacing={3}>
            {cards.map((card) => (
                <Grid item xs={12} sm={6} md={6} key={card.title}>
                    <Card>
                        <CardActionArea href={card.route}>
                            <CardMedia
                                component="img"
                                height="140"
                                image={card.imageUrl}
                                alt={card.title} />
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="div">
                                    {card.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {card.description}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
            ))}
        </Grid>

    </Box>
    <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>
            {divisionCounts.map((d) => (
                <Grid item xs={4} key={d.division}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">{d.division}</Typography>
                    <Typography variant="h4">{d.count}</Typography>
                </Paper>
                </Grid>
            ))}
            </Grid>
    </Box>
    </>
  );
}

export default Dashboard;
