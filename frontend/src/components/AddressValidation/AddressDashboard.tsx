import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MapView from "./MapView";
import { checkPlayersInDistrict, geocodeMissingPlayers } from "../../api/address";
import { usePlayers } from "../../hooks/usePlayers";
import { usePlayerGeo } from "../../hooks/usePlayerGeo";
import {lightGreen} from '@mui/material/colors';


type PlayerRow = {
  id?: number | null;
  player_id?: number | null;
  row_number?: number | null;
  first_name: string;
  last_name: string;
  address_line_1: string;
  latitude?: number | null;
  longitude?: number | null;
  in_district?: boolean | null;
  is_eligible?: boolean | null;
  school_name?: string | null;
  status: string; // required string, not nullable
  error?: string | null;
  division?: {
    id: number;
    name: string;
  };
  // allow additional backend fields without breaking setPlayers typing
  [key: string]: any;
  
};

type BackendResult = any[];

const AddressDashboard: React.FC = () => {
  const [failures, setFailures] = useState<PlayerRow[]>([]);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [singleAddress, setSingleAddress] = useState("");
  const [singleAddressResult, setSingleAddressResult] = useState<any>(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
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

  // Accordion state for results table
  const [resultsAccordionOpen, setResultsAccordionOpen] = useState(true);

  const { players, setPlayers, loading } = usePlayers();
  const { geocode } = usePlayerGeo(players, setPlayers);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllMissing = () => {
    const missing = players
      .filter((p) => !p.latitude || !p.longitude)
      .map((p) => p.player_id)
      .filter((id): id is number => id != null);

    setSelectedIds(missing);
  };

  const handleGetLocations = async () => {
    if (!selectedIds.length) {
      setSnackbar({
        open: true,
        message: "No players selected for geocoding.",
        severity: "error",
      });
      return;
    }

    setLoadingGeocode(true);
    try {
      // Only pass selected players to geocode
      const result = await geocode(selectedIds);

      // Apply geocode results only for players in selectedIds
      setPlayers((prev) =>
        prev.map((p) => {
          if (!selectedIds.includes(p.player_id!)) return p;

          // Find the corresponding failure if any
          const failure = result.failures?.find((f: any) => f.player_id === p.player_id);
          if (failure) {
            return {
              ...p,
              status: "FAILED",
              error: failure.error ?? "Unknown error",
            };
          }

          // Otherwise mark as geocoded
          return {
            ...p,
            status: "SUCCESS",
            latitude: p.latitude ?? 0, // optionally leave as-is if backend returns values
            longitude: p.longitude ?? 0,
          };
        })
      );

      // Store failures in state
      setFailures(result.failures ?? []);

      setSnackbar({
        open: true,
        message: `Geocode complete. Success: ${result.successCount}, Failures: ${result.failureCount}`,
        severity: result.failureCount ? "error" : "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Geocode failed.",
        severity: "error",
      });
    }
    setLoadingGeocode(false);
  };
  // ---------------------------
  // Check Players (KML)
  // ---------------------------
const handleCheckPlayers = async () => {
  if (!players.length) {
    setSnackbar({ open: true, message: "No players to check.", severity: "error" });
    return;
  }
  setLoadingCheck(true);
  try {
    const selectedPlayers = players.filter(p => p.latitude && p.longitude); // or selectedIds if needed
    console.log(players);
    const data = await checkPlayersInDistrict(players);
    console.log("[Check Players] Backend response:", data);
  

    const successRows: PlayerRow[] = data.results.filter((r: any) => r.status === "SUCCESS");
    const failedRows: PlayerRow[] = data.results.filter((r: any) => r.status === "FAILED");

    setPlayers((prev) =>
      prev.map((row) => {
        const updated =
          successRows.find(r => r.player_id === row.player_id) ||
          failedRows.find(r => r.player_id === row.player_id);

        return updated
          ? {
              ...row,
              in_district: updated.in_district ?? null,
              status: updated.status ?? row.status ?? "",
            }
          : row;
      })
    );

    setFailures(failedRows);
  } catch (err) {
    console.error("Check Players error:", err);
    setSnackbar({ open: true, message: "Error checking players.", severity: "error" });
  }
  setLoadingCheck(false);
};

  // ---------------------------
  // Check Eligibility
  // ---------------------------
  const handleCheckEligibility = async () => {
    if (!players.length) {
      setSnackbar({ open: true, message: "No players to check.", severity: "error" });
      return;
    }

    setLoadingEligibility(true);
    try {
      const res = await fetch("/api/check-player-eligibility/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players }),
      });

      const data = await res.json();
      console.log("[Check Eligibility] Backend response:", data);

      setPlayers((prev) =>
        prev.map((p) => {
          const updated = data.results?.find((r: any) => r.player_id === p.player_id);
          return updated
            ? {
                ...p,
                is_eligible: updated.is_eligible ?? p.is_eligible,
              }
            : p;
        })
      );

      setSnackbar({
        open: true,
        message: "Eligibility check complete.",
        severity: "success",
      });
    } catch (err) {
      console.error("Eligibility check error:", err);
      setSnackbar({ open: true, message: "Eligibility check failed.", severity: "error" });
    }

    setLoadingEligibility(false);
  };

  // ---------------------------
  // Single Address
  // ---------------------------

  const handleSingleAddressCheck = async () => {
    if (!singleAddress.trim()) return;
    setLoadingSingle(true);
    try {
      const res = await fetch(`/api/check_address/?address=${encodeURIComponent(singleAddress)}`);
      const data = await res.json();
      console.log("[Single Address] Backend response:", data);
      setSingleAddressResult(data);
    } catch (err) {
      console.error("Single Address error:", err);
      setSnackbar({ open: true, message: "Address lookup failed.", severity: "error" });
    }
    setLoadingSingle(false);
  };

  // ---------------------------
  // Download CSVs
  // ---------------------------
    // Helper function for CSV escaping
    function escapeCSV(val: string | number | null | undefined): string {
      if (val == null) return '""';
      const str = String(val);
      // If value contains a comma, double-quote, or newline, wrap in quotes and double the quotes
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const handleLocationFailures = () => {
      if (!failures.length) return;
      // Generate CSV from the `failures` array with columns: ID, First, Last, Address, Status, Error
      const csvRows = [
        ["ID", "First", "Last", "Address", "Status", "Error"].join(","),
        ...failures.map(fail =>
          [
            escapeCSV(fail.player_id ?? fail.id ?? "-"),
            escapeCSV(fail.first_name),
            escapeCSV(fail.last_name),
            escapeCSV(fail.address_line_1 || "-"),
            escapeCSV(fail.status),
            escapeCSV(fail.error ?? "-")
          ].join(",")
        )
      ];
      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "location_failures.csv";
      link.click();
    }

    const handleDistrictFailures = () => {
      const outsideDistrict = players.filter(p => p.is_eligible === false);
      if (!outsideDistrict.length) return;
      
      const csvRows = [
        ["ID", "First", "Last", "Address", "City", "State", "School Name","In District", "Is Eligible",  "Division"].join(","),
        ...outsideDistrict.map(p =>
          [
            escapeCSV(p.player_id ?? p.id ?? "-"),
            escapeCSV(p.first_name),
            escapeCSV(p.last_name),
            escapeCSV(p.address_line_1 || "-"),
            escapeCSV(p.city || "N/A"),
            escapeCSV(p.state || "N/A"),
            escapeCSV(p.school_name || "N/A"),
            escapeCSV(p.in_district == null ? "N/A" : p.in_district ? "Yes" : "No"),
            escapeCSV(p.is_eligible == null ? "N/A" : p.is_eligible ? "Yes" : "No"),
            escapeCSV(p.division?.name || "N/A"),
            "No"
          ].join(",")
        )
      ];
      
      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "outside_district.csv";
      link.click();
    }
    const handleDownloadFailures = () => {
      if (!failures.length) return;
      const csv = [
        ["ID", "First", "Last", "Address", "Status", "Error"].join(","),
        ...failures.map(fail =>
          [
            fail.player_id ?? fail.id ?? "-",
            fail.first_name,
            fail.last_name,
            fail.address_line_1 || "-",
            fail.status,
            fail.error ?? "-"
          ].join(",")
        )
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "failed_addresses.csv";
      link.click();
    };

  
  const handleDownload = () => {
    if (!players.length) return;
    const csv = [Object.keys(players[0]).join(","), ...players.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "players.csv";
    link.click();
  };

  // ---------------------------
  // Filtered rows
  // ---------------------------
  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return players;
    const f = filterText.toLowerCase();
    return players.filter(
      (r: PlayerRow) =>
        r.first_name.toLowerCase().includes(f) ||
        r.last_name.toLowerCase().includes(f) ||
        r.address_line_1.toLowerCase().includes(f)
    );
  }, [players, filterText]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Address Dashboard
      </Typography>

      {/* Stacked Snackbars */}
      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={8000}
        onClose={(event, reason) => {
          if (reason === "clickaway") return;
          setSuccessSnackbar({ ...successSnackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: 8 }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccessSnackbar({ ...successSnackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {`Total Successes: ${successSnackbar.count}`}
        </Alert>
      </Snackbar>
      <Snackbar
        open={failureSnackbar.open}
        autoHideDuration={8000}
        onClose={(event, reason) => {
          if (reason === "clickaway") return;
          setFailureSnackbar({ ...failureSnackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: 2 }}
      >
        <Alert
          severity="error"
          onClose={() => setFailureSnackbar({ ...failureSnackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {`Total Failures: ${failureSnackbar.count}`}
        </Alert>
      </Snackbar>
      {/* Legacy single snackbar for other errors */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={15000}
        onClose={(event, reason) => {
          if (reason === "clickaway") return;
          setSnackbar({ ...snackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
   {/* Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={selectAllMissing}>
          Select All Missing
        </Button>

        <Button variant="contained" color="secondary" disabled={loadingGeocode} onClick={handleGetLocations}>
          {loadingGeocode ? <CircularProgress size={20} /> : "Get Locations"}
        </Button>

        <Button variant="contained" color="success" disabled={loadingCheck} onClick={handleCheckPlayers}>
          {loadingCheck ? <CircularProgress size={20} /> : "Check Players"}
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: lightGreen[500],
            '&:hover': {
              backgroundColor: lightGreen[700],
            },
          }}
          disabled={loadingEligibility}
          onClick={handleCheckEligibility}
        >
          {loadingEligibility ? <CircularProgress size={20} /> : "Check Eligibility"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Button
        variant="outlined"
        disabled={!failures.length}
        onClick={handleDownloadFailures}
      >
        Download Failed Addresses
      </Button>

      <Button
        variant="contained"
        color="success"
        disabled={!failures.length}
        onClick={handleLocationFailures}
      >
        Download Location Failures
      </Button>
        <Button
        variant="outlined"
        color="warning"
        onClick={handleDistrictFailures}
        
      >
        Download Ineligible
      </Button>

      </Box>

   {/* Counter */}
   <Typography>Player Count: {players.length}</Typography>
   <Typography>Location Failures: {failures.length}</Typography>
   <Typography>Missing: {players.filter(p => !p.latitude || !p.longitude).length}</Typography>
   <Typography>In District: {players.filter(p => p.in_district === true).length}</Typography>
   <Typography>Out of District: {players.filter(p => p.in_district === false).length}</Typography>
    <Typography>Eligible: {players.filter(p => p.is_eligible === true).length}</Typography>
    <Typography>Ineligible: {players.filter(p => p.is_eligible === false).length}</Typography>
      {/* Map */}
      <Box sx={{ mt: 3, p: 3, border: "1px solid #ddd", borderRadius: 2 }}>
        <Typography variant="h6">District Map</Typography>
        <MapView kmlUrl="/cleaned_8.kml" />
      </Box>

      {/* Single Address */}
      <Box sx={{ mt: 3, p: 3, border: "1px solid #ddd", borderRadius: 2 }}>
        <Typography variant="h6">Single Address Lookup</Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <TextField fullWidth label="Address" value={singleAddress} onChange={(e) => setSingleAddress(e.target.value)} />
          <Button variant="contained" onClick={handleSingleAddressCheck}>
            Check
          </Button>
        </Box>
        {singleAddressResult && <pre>{JSON.stringify(singleAddressResult, null, 2)}</pre>}
      </Box>

      {/* Results Table in Accordion */}
      <Accordion
        expanded={resultsAccordionOpen}
        onChange={(_, expanded) => setResultsAccordionOpen(expanded)}
        sx={{ mt: 3 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Players</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            size="small"
            label="Filter"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>First</TableCell>
                  <TableCell>Last</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Lat</TableCell>
                  <TableCell>Lng</TableCell>
                  <TableCell>In District</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Eligible</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((p, i) => {
                  const uniqueKey = p.player_id ?? p.id ?? p.row_number ?? i;
                  const displayId = p.player_id ?? p.id ?? "-";
                  // Ensure lat/lng/in_district/status are always up to date from row
                  return (
                    <TableRow
                      key={uniqueKey}
                      sx={{
                        backgroundColor:
                          p.latitude && p.longitude ? "#f5f5f5" : "inherit",
                        opacity: p.latitude && p.longitude ? 0.7 : 1,
                      }}
                    >
                      <TableCell padding="checkbox">
                        {p.player_id != null && (
                          <input
                            title={`Select ${p.first_name} ${p.last_name}`}
                            type="checkbox"
                            disabled={!!(p.latitude && p.longitude)}
                            checked={selectedIds.includes(p.player_id)}
                            onChange={() => toggleSelect(p.player_id!)}
                          />
                        )}
                      </TableCell>
                      <TableCell>{displayId}</TableCell>
                      <TableCell>{p.first_name}</TableCell>
                      <TableCell>{p.last_name}</TableCell>
                      <TableCell>{p.address_line_1}</TableCell>
                      <TableCell>{p.division?.name ?? "N/A"}</TableCell>
                      <TableCell>
                        {p.latitude !== null && p.latitude !== undefined
                          ? Number(p.latitude).toFixed(5)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {p.longitude !== null && p.longitude !== undefined
                          ? Number(p.longitude).toFixed(5)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {p.in_district == null
                          ? "-"
                          : p.in_district
                          ? "Yes"
                          : "No"}
                      </TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>
                        {p.is_eligible == null ? "-" : p.is_eligible ? "Yes" : "No"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default AddressDashboard;