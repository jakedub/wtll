import { geocodeMissingPlayers } from "../api/address";
import { PlayerRow } from "./usePlayers";

export const usePlayerGeo = (
  players: PlayerRow[],
  setPlayers: React.Dispatch<React.SetStateAction<PlayerRow[]>>
): { geocode: (selectedIds: number[]) => Promise<{ successCount: number; failureCount: number; failures: any[] }> } => {
  const geocode = async (selectedIds: number[]) => {
    const data = await geocodeMissingPlayers(selectedIds)

    const success = data.results || [];
    const failures = data.failures || [];

    setPlayers((prev) =>
      prev.map((row) => {
        if (!row.player_id || !selectedIds.includes(row.player_id)) {
          return row;
        }

        const updated = success.find(
          (r: { player_id: number }) => r.player_id === row.player_id
        ) as
          | {
              player_id: number;
              latitude?: number | null;
              longitude?: number | null;
              status?: string | null;
            }
          | undefined;

        if (!updated) {
          return row;
        }

        return {
          ...row,
          latitude: updated.latitude ?? null,
          longitude: updated.longitude ?? null,
          status: updated.status ?? row.status ?? "",
        };
      })
    );

    return {
      successCount: success.length,
      failureCount: failures.length,
      failures,
    };
  };

  return { geocode };
};