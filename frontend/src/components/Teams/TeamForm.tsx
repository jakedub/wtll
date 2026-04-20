import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Autocomplete,
  Chip,
} from "@mui/material";
import axios from "axios";

interface Division {
  id: number;
  name: string;
}

interface TeamPayload {
  name: string;
  coach: string;
  is_active: boolean;
  assistant_coach: string;
  year: number;
  division: number;
}

const TeamForm: React.FC = () => {
  const [teamName, setTeamName] = useState("");
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisions, setSelectedDivisions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      const res = await axios.get("/api/divisions/");
      console.log("Divisions fetched from API:", res.data);
      setDivisions(res.data);
    } catch {
      console.error("Failed to fetch divisions from /api/divisions/");
      setSnackbar({
        open: true,
        message: "Failed to load divisions",
        severity: "error",
      });
    }
  };

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      setSnackbar({
        open: true,
        message: "Team name is required",
        severity: "error",
      });
      return;
    }

    if (!selectedDivisions.length) {
      setSnackbar({
        open: true,
        message: "Select at least one division",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      for (const divisionId of selectedDivisions) {
        const payload: TeamPayload = {
          name: teamName.trim(),
          coach: "",
          is_active: true,
          year: year,
          division: divisionId,
          assistant_coach: ""
        };
        console.log("Submitting team payload to API:", payload);
        const response = await axios.post("/api/teams/", payload);
        console.log(`Team creation response for division ${divisionId}:`, response.data);
      }

      setSnackbar({
        open: true,
        message: "Teams created successfully",
        severity: "success",
      });

      setTeamName("");
      setSelectedDivisions([]);
    } catch (error) {
      console.error("Team creation failed during batch submission.", error);
      setSnackbar({
        open: true,
        message: "Failed to create teams",
        severity: "error",
      });
    }

    setLoading(false);
  };

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create Team
          </Typography>

          <TextField
            label="Team Name"
            fullWidth
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            label="Year"
            type="number"
            fullWidth
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle1" gutterBottom>
            Assign Divisions
          </Typography>

          <Autocomplete
            multiple
            options={divisions}
            getOptionLabel={(option) => option.name}
            value={divisions.filter((d) => selectedDivisions.includes(d.id))}
            onChange={(_, newValue) => {
              const divisionIds = newValue.map((d) => d.id);
              console.log("Selected divisions changed:", divisionIds);
              setSelectedDivisions(divisionIds);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Select Divisions" placeholder="Divisions" />
            )}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            Create Team
          </Button>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamForm;