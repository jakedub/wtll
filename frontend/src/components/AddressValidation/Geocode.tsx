// src/components/AddressValidation/Geocode.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, FormControl, InputLabel, TextField, Button, styled, CircularProgress, Snackbar } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Papa from 'papaparse';

type CheckResult = { [key: string]: any };

type GeocodeProps = {
  onResults?: (rows: CheckResult[]) => void;
};

const Geocode: React.FC<GeocodeProps> = ({ onResults }) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [singleAddress, setSingleAddress] = useState<string>('');
  const [singleAddressResult, setSingleAddressResult] = useState<any>(null);
  const [isSingleAddressProcessing, setIsSingleAddressProcessing] = useState(false);
  const [failedAddresses, setFailedAddresses] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  // --- Step 1: Upload CSV and create/update players ---
  const handleUploadCSV = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-csv-players/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log('[CSV Upload] Backend response:', data);
      setResult(data);
      if (onResults && Array.isArray(data.results)) {
        onResults(data.results);
      }
      setSnackbarMessage('CSV upload processing completed.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('[CSV Upload] Error:', error);
      setResult(null);
      if (onResults) onResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Step 2: Geocode missing player addresses ---
  const handleGeocodeMissing = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/geocode-missing-players/', { method: 'POST' });
      const data = await response.json();
      console.log('[Geocode Missing] Backend response:', data);
      setResult(data);
      if (data.failed && Array.isArray(data.failed)) {
        setFailedAddresses(data.failed);
      } else {
        setFailedAddresses([]);
      }
      if (onResults && Array.isArray(data.results)) {
        onResults(data.results);
      }
      setSnackbarMessage('Geocode processing completed.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('[Geocode Missing] Error:', error);
      setResult(null);
      setFailedAddresses([]);
      if (onResults) onResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Step 3: Check players against district KML ---
  const handleCheckDistrict = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/check-players-in-district/', { method: 'POST' });
      const data = await response.json();
      console.log('[Check District] Backend response:', data);
      setResult(data);
      if (onResults && Array.isArray(data.results)) {
        onResults(data.results);
      }
      setSnackbarMessage('District check processing completed.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('[Check District] Error:', error);
      setResult(null);
      if (onResults) onResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Optional: Download failed addresses as CSV ---
  const handleDownloadFailedAddresses = () => {
    if (!failedAddresses.length) return;
    // Generate CSV from failedAddresses array (as one column: Address)
    const rows = failedAddresses.map(addr => ({ Address: addr }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_addresses.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // --- New: Check single address ---
  const handleCheckSingleAddress = async () => {
    if (!singleAddress.trim()) return;
    setIsSingleAddressProcessing(true);
    setSingleAddressResult(null);

    try {
      const response = await fetch('/api/check-address/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: singleAddress }),
      });
      const data = await response.json();
      console.log('[Check Single Address] Backend response:', data);
      setSingleAddressResult(data);
    } catch (error) {
      console.error('[Check Single Address] Error:', error);
      setSingleAddressResult({ error: 'Failed to check address' });
    } finally {
      setIsSingleAddressProcessing(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4">Player Geocode & District Check</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<FileUploadIcon />}
            component="label"
            disabled={!!file || isProcessing}
          >
            {file ? file.name : 'Upload CSV'}
            {!file && (
              <VisuallyHiddenInput
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const f = e.target.files ? e.target.files[0] : null;
                  setFile(f);
                  setResult(null);
                  setEstimatedSeconds(null);

                  if (f) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const text = String(ev.target?.result || '');
                        const lines = text.split(/\r\n|\n/).filter(Boolean).length;
                        setEstimatedSeconds(Math.max(0, lines - 1));
                      } catch {
                        setEstimatedSeconds(null);
                      }
                    };
                    reader.readAsText(f);
                  }
                }}
              />
            )}
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadCSV}
            disabled={isProcessing || !file}
          >
            Process CSV
          </Button>
          <Button variant="contained" onClick={handleGeocodeMissing} disabled={isProcessing}>
            Get Locations
          </Button>
          <Button variant="contained" onClick={handleCheckDistrict} disabled={isProcessing}>
            Check Players
          </Button>
        </Box>
        <Box>
          <Button variant="outlined" onClick={handleDownloadFailedAddresses} disabled={!failedAddresses.length}>
            Download Failed Addresses
          </Button>
        </Box>

        {/* New section for single address check */}
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 400 }}>
          <Typography variant="h6">Check Single Address</Typography>
          <TextField
            label="Address"
            variant="outlined"
            value={singleAddress}
            onChange={(e) => setSingleAddress(e.target.value)}
            disabled={isSingleAddressProcessing}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleCheckSingleAddress}
            disabled={isSingleAddressProcessing || !singleAddress.trim()}
          >
            Check Address
          </Button>
          {isSingleAddressProcessing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Checking address...</Typography>
            </Box>
          )}
          {singleAddressResult && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1">Result:</Typography>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(singleAddressResult, null, 2)}
              </pre>
            </Box>
          )}
        </Box>
      </Box>

      {isProcessing && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Processing {estimatedSeconds ? `— est. ${estimatedSeconds}s` : '...'}</Typography>
        </Box>
      )}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Backend Results:</Typography>
          <pre>{JSON.stringify(result, null, 5)}</pre>
        </Box>
      )}

      {failedAddresses.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" color="error">Failed Geocode Addresses:</Typography>
          <ul>
            {failedAddresses.map((addr, idx) => (
              <li key={idx}>{addr}</li>
            ))}
          </ul>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={null} // persist until manually closed
      />
    </Box>
  );
};

export default Geocode;