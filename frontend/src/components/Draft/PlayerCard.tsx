// /frontend/src/components/Draft/PlayerCard.tsx
import React from "react";
import { Card, CardContent, Typography, Chip, Stack, Tooltip } from "@mui/material";

export type TierSpot = 1 | 2 | 3 | 4 | 5;
export type PitcherTier = "Ace" | "Strong" | "Development" | "None";
export type CatcherTier = "Elite" | "Strong" | "Emergency" | "None";

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  tier_spot: TierSpot;
  pitcher_tier: PitcherTier;
  catcher_tier: CatcherTier;
  overall_total: number;
  total_pitching: number;
  total_catcher: number;
}

interface PlayerCardProps {
  player: Player;
}

const tierColors = {
  overall: { 1: "green", 2: "blue", 3: "orange", 4: "purple", 5: "grey" },
  pitcher: { Ace: "green", Strong: "blue", Development: "orange", None: "grey" },
  catcher: { Elite: "green", Strong: "blue", Emergency: "orange", None: "grey" },
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {player.first_name} {player.last_name}
        </Typography>
        <Stack direction="row" spacing={1} mt={1}>
          <Tooltip title={`Overall: ${player.overall_total}`}>
            <Chip
              label={`Tier ${player.tier_spot}`}
              sx={{ backgroundColor: tierColors.overall[player.tier_spot], color: "white" }}
              size="small"
            />
          </Tooltip>

          {player.pitcher_tier !== "None" && (
            <Tooltip title={`Pitching total: ${player.total_pitching}`}>
              <Chip
                label={`⚾ ${player.pitcher_tier}`}
                sx={{ backgroundColor: tierColors.pitcher[player.pitcher_tier], color: "white" }}
                size="small"
              />
            </Tooltip>
          )}

          {player.catcher_tier !== "None" && (
            <Tooltip title={`Catcher total: ${player.total_catcher}`}>
              <Chip
                label={`🧤 ${player.catcher_tier}`}
                sx={{ backgroundColor: tierColors.catcher[player.catcher_tier], color: "white" }}
                size="small"
              />
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;