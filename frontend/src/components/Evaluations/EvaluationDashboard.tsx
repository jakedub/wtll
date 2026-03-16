import React, { useState, useEffect } from 'react';
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
  IconButton,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { getEvaluations, importEvalCsv } from '../../api/evaluation';
import type { Evaluation } from '../../models/evaluation';
import './Evaluations.css';
import { useNavigate, Link } from 'react-router-dom';


const EvaluationDashboard: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvals, setFilteredEvals] = useState<Evaluation[]>([]);
  const [allEvals, setAllEvals] = useState<Evaluation[]>([]);
  const [rows, setRows] = useState<Evaluation[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const [success, setSuccess] = useState<Evaluation[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all');
  const [selectedDivision, setSelectedDivision] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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


    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const handleButtonClick = () => {
      fileInputRef.current?.click(); // Opens file picker
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setFileName(selectedFile.name);
        handleEvaluationUpload(selectedFile); // pass the selected file directly
      }
    };
    const handleEvaluationUpload = async (uploadFile: File) => {
      if (!uploadFile) return;
      console.log("[CSV Upload] File object:", uploadFile);
      setLoading(true);
      try {
        const data = await importEvalCsv(uploadFile);
        console.log("[CSV Upload] Backend response:", data);
        // Normalize inserted and updated players
        // Set newPlayers to inserted
        setEvaluations(data.results || []);
        // Set failedPlayers to failures
        setFailures(data.failures || []);

        // Show snackbar with success message including counts
        const successCount = data.results ? data.results.length : 0;
        const failureCount = data.failures ? data.failures.length : 0;
        setSnackbar({
          open: true,
          message: `Upload successful: ${successCount} evaluations processed, ${failureCount} failures.`,
          severity: "success",
        });

        // Refresh evaluations list after successful upload
        const refreshedData = await getEvaluations();
        setEvaluations(refreshedData);
        setFilteredEvals(refreshedData);
      } catch (err: any) {
        console.error("CSV Upload error:", err.response?.data || err);
        setSnackbar({ open: true, message: "Error uploading CSV.", severity: "error" });
      }
      setLoading(false);
    };



  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const data = await getEvaluations();
        console.log("Fetched evaluations data:", data);
        setEvaluations(data);
        setFilteredEvals(data);
      } catch (error) {
        console.error("Failed to fetch evaluations:", error);
      }
    };
    fetchEvaluations();
  }, []);

  useEffect(() => {
    let filtered = evaluations;

    if (selectedYear !== 'all') {
      filtered = filtered.filter((evalItem) => evalItem.season_year.toString() === selectedYear);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((evalItem) => evalItem.evaluation_type === selectedType);
    }

    if (selectedTeam !== 'all') {
      filtered = filtered.filter((evalItem) => evalItem.player.team?.name === selectedTeam);
    }

    if (selectedDivision !== 'all') {
      filtered = filtered.filter((evalItem) => evalItem.player.division?.name === selectedDivision);
    }

    setFilteredEvals(filtered);
  }, [selectedYear, selectedType, selectedTeam, selectedDivision, evaluations]);

  // Unique years, teams, and divisions
  const uniqueYears = Array.from(new Set(evaluations.map((e) => e.season_year))).sort();
  const uniqueTeams = Array.from(new Set(evaluations.map((e) => e.player.team?.name).filter(Boolean)));
  const uniqueDivisions = Array.from(new Set(evaluations.map((e) => e.player.division?.name).filter(Boolean)));

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e: SelectChangeEvent) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {uniqueYears.map((year) => (
              <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            label="Type"
            onChange={(e: SelectChangeEvent) => setSelectedType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pre">Pre-Season</MenuItem>
            <MenuItem value="post">Post-Season</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Team</InputLabel>
          <Select
            value={selectedTeam}
            label="Team"
            onChange={(e: SelectChangeEvent) => setSelectedTeam(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {uniqueTeams.map((team) => (
              <MenuItem key={team} value={team}>{team}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Division</InputLabel>
          <Select
            value={selectedDivision}
            label="Division"
            onChange={(e: SelectChangeEvent) => setSelectedDivision(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {uniqueDivisions.map((div) => (
              <MenuItem key={div} value={div}>{div}</MenuItem>
            ))}
          </Select>
        </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>&nbsp;</InputLabel>
          <Button
            style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}
            onClick={() => {
              setSelectedYear('all');
              setSelectedType('all');
              setSelectedTeam('all');
              setSelectedDivision('all');
            }}
          >
            Reset Filters
          </Button>
        </FormControl>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Button 
            variant='outlined' 
            color='secondary' 
            onClick={() => navigate('/evaluations/add')}>Generate Evalution Forms</Button>
          <Button variant='contained' color='primary' onClick={() => navigate('/evaluations/chart')}>
            View Player Data
          </Button>
          <input
            title="Upload Evaluation CSV"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <Button 
            variant="outlined" 
            color="primary"
            onClick={handleButtonClick}>
            Upload Evaluation Data
          </Button>
        </Box>

      </Box>
              {/* Display failed rows below upload button */}
        {failures.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" color="error">Failed Rows:</Typography>
            <List dense>
              {failures.map((fail, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Row ${fail.row || index + 1}: Player ${fail.player || 'Unknown'} - Reason: ${fail.error || 'Unknown'}`}
                />
              </ListItem>
              ))}
            </List>
          </Box>
        )}

      {/* Header showing the current filter */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Showing {selectedYear === 'all' ? 'all years' : selectedYear} - {selectedType === 'all' ? 'all types' : selectedType === 'pre' ? 'Pre-Season' : 'Post-Season'}
        , {selectedTeam === 'all' ? 'all teams' : selectedTeam} - {selectedDivision === 'all' ? 'all divisions' : selectedDivision}
      </Typography>

      {/* Evaluation Cards */}
      <Grid container spacing={3}>
        {filteredEvals.map((evaluation) => (
          <Grid item xs={12} sm={6} md={4} key={evaluation.id}>
            <Card>
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  <Link
                    to={'/players/' + evaluation.player.id}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                 {evaluation.player.first_name} {evaluation.player.last_name}
                 </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Team: {evaluation.player.team?.name || 'N/A'} | Division: {evaluation.player.division?.name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hitting: {evaluation.hitting_power}/{evaluation.hitting_contact}/{evaluation.hitting_form} | Total: {evaluation.total_hitting}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fielding: {evaluation.fielding_form}/{evaluation.fielding_glove}/{evaluation.fielding_hustle} | Total: {evaluation.total_fielding}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Throwing: {evaluation.throwing_form}/{evaluation.throwing_speed}/{evaluation.throwing_accuracy} | Total: {evaluation.total_throwing}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pitching: {evaluation.pitching_speed}/{evaluation.pitching_accuracy} | Total: {evaluation.total_pitching}
                </Typography>
                <Typography>
                  Catcher: {evaluation.catcher_blocking}/{evaluation.catcher_receiving} | Total: {evaluation.total_catcher}
                </Typography>
                <Typography>
                  Tier: {evaluation.tier_spot}
                </Typography>

                <Typography>
                  Overall: {evaluation.overall_total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvaluationDashboard;
