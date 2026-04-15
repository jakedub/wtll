import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

import { getEvaluations, importEvalCsv, downloadEvaluationCSV } from "../../api/evaluation";
import type { Evaluation } from "../../models/evaluation";

import "./Evaluations.css";
import { useNavigate, Link } from "react-router-dom";

interface ComputedEvaluation extends Evaluation {
  total_hitting: number;
  total_fielding: number;
  total_throwing: number;
  total_pitching: number;
  total_catcher: number;
  overall_total: number;
  rank: number;
}

const EvaluationDashboard: React.FC = () => {
  const [evaluations, setEvaluations] = useState<ComputedEvaluation[]>([]);
  const [filteredEvals, setFilteredEvals] = useState<ComputedEvaluation[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | "all">("all");
  const [selectedType, setSelectedType] = useState<string | "all">("all");
  const [selectedTeam, setSelectedTeam] = useState<string | "all">("all");
  const [selectedDivision, setSelectedDivision] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const computeTotalsAndRank = (evals: Evaluation[]): ComputedEvaluation[] => {
    const computed = evals.map((e) => {
      const total_hitting =
        Number(e.hitting_power || 0) +
        Number(e.hitting_contact || 0) +
        Number(e.hitting_form || 0);

      const total_fielding =
        Number(e.fielding_form || 0) +
        Number(e.fielding_glove || 0) +
        Number(e.fielding_hustle || 0);

      const total_throwing =
        Number(e.throwing_form || 0) +
        Number(e.throwing_speed || 0) +
        Number(e.throwing_accuracy || 0);

      const total_pitching =
        Number(e.pitching_speed || 0) +
        Number(e.pitching_accuracy || 0);

      const total_catcher =
        Number(e.catcher_blocking || 0) +
        Number(e.catcher_receiving || 0);

      const overall_total =
        total_hitting + total_fielding + total_throwing + total_pitching + total_catcher;

      return {
        ...e,
        total_hitting,
        total_fielding,
        total_throwing,
        total_pitching,
        total_catcher,
        overall_total,
        rank: 0,
      };
    });

    computed.sort((a, b) => b.overall_total - a.overall_total);

    let currentRank = 1;

    for (let i = 0; i < computed.length; i++) {
      if (i > 0 && computed[i].overall_total < computed[i - 1].overall_total) {
        currentRank = i + 1;
      }
      computed[i].rank = currentRank;
    }

    return computed;
  };

  const handleEvaluationUpload = async (file: File) => {
    setLoading(true);

    try {
      const data = await importEvalCsv(file);

      const computed = computeTotalsAndRank(data.results || []);
      setEvaluations(computed);
      setFilteredEvals(computed);

      setFailures(data.failures || []);

      setSnackbar({
        open: true,
        message: `Upload successful: ${data.results.length} rows`,
        severity: "success",
      });
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        message: "Error uploading CSV",
        severity: "error",
      });
    }

    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    handleEvaluationUpload(file);
  };

  useEffect(() => {
    const fetchEvaluations = async () => {
      const data = await getEvaluations();
      const computed = computeTotalsAndRank(data);

      setEvaluations(computed);
      setFilteredEvals(computed);
    };

    fetchEvaluations();
  }, []);

  useEffect(() => {
    let filtered = evaluations;

    if (selectedYear !== "all") {
      filtered = filtered.filter((e) => e.season_year.toString() === selectedYear);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((e) => e.evaluation_type === selectedType);
    }

    if (selectedTeam !== "all") {
      filtered = filtered.filter((e) => e.player.team?.name === selectedTeam);
    }

    if (selectedDivision !== undefined) {
      filtered = filtered.filter((e) => e.player.division?.id === selectedDivision);
    }

    setFilteredEvals(filtered);
  }, [selectedYear, selectedType, selectedTeam, selectedDivision, evaluations]);

  const uniqueYears = Array.from(new Set(evaluations.map((e) => e.season_year))).sort();

  const uniqueTeams = Array.from(
    new Set(evaluations.map((e) => e.player.team?.name).filter(Boolean))
  );

  const uniqueDivisions = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();

    evaluations.forEach((e) => {
      const div = e.player.division;
      if (div && !map.has(div.id)) {
        map.set(div.id, div);
      }
    });

    return Array.from(map.values());
  }, [evaluations]);

  const handleExportCSV = async () => {
    try {
      setLoading(true);

      const csv = await downloadEvaluationCSV(selectedDivision);

      const blob = new Blob([csv as any], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `evaluations_${selectedDivision ?? "all"}.csv`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        message: "Failed to export CSV",
        severity: "error",
      });
    }

    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
            <MenuItem value="all">All</MenuItem>

            {uniqueYears.map((year) => (
              <MenuItem key={year} value={year.toString()}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>

          <Select value={selectedType} label="Type" onChange={(e) => setSelectedType(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pre">Pre</MenuItem>
            <MenuItem value="post">Post</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Division</InputLabel>

          <Select
            value={selectedDivision?.toString() ?? "all"}
            label="Division"
            onChange={(e: SelectChangeEvent<string>) => {
              const v = e.target.value;
              setSelectedDivision(v === "all" ? undefined : Number(v));
            }}
          >
            <MenuItem value="all">All</MenuItem>

            {uniqueDivisions.map((d) => (
              <MenuItem key={d.id} value={d.id.toString()}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={() => navigate("/evaluations/add")}>
          Generate Forms
        </Button>

        <Button variant="contained" onClick={() => navigate("/evaluations/chart")}>
          Player Data
        </Button>

        <input
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
          title="Upload Evaluation CSV"
          placeholder="Upload Evaluation CSV"
        />

        <Button variant="outlined" onClick={handleButtonClick}>
          Upload CSV
        </Button>

        <Button variant="contained" onClick={handleExportCSV}>
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={3}>
        {filteredEvals.map((e) => (
          <Grid item xs={12} md={4} key={e.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  <Link to={`/players/${e.player.id}`}>
                    {e.player.first_name} {e.player.last_name}
                  </Link>
                </Typography>

                <Typography>Team: {e.player.team?.name ?? "N/A"}</Typography>
                <Typography>Division: {e.player.division?.name ?? "N/A"}</Typography>

                <Typography>Overall: {e.overall_total}</Typography>
                <Typography>Rank: {e.rank}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EvaluationDashboard;