import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Modal,
  TextField,
  Stack
} from '@mui/material';
import { Link } from 'react-router-dom';
import { getDrafts, createDraft } from '../../api/draft';
import type { Draft } from '../../models/draft';

const DraftDashboard: React.FC = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftYear, setDraftYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const data = await getDrafts();
        setDrafts(data);
      } catch (err) {
        console.error('Failed to load drafts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const handleCreateDraft = async () => {
    try {
      const newDraft = await createDraft(draftName, draftYear);
      setDrafts((prev) => [...prev, newDraft]);
      setDraftName('');
      setDraftYear(new Date().getFullYear());
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to create draft', err);
    }
  };

  if (loading) return <Typography>Loading drafts...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Existing Drafts</Typography>
        <Button variant="contained" onClick={() => setModalOpen(true)}>Create Draft</Button>
      </Stack>

      {drafts.length > 0 ? (
        <List>
          {drafts.map((draft) => (
            <ListItem
              key={draft.id}
              divider
              button
              component={Link}
              to={`/draft/${draft.id}`}
            >
              <ListItemText
                primary={draft.name}
                secondary={`Year: ${draft.year}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography>No drafts found.</Typography>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          p: 3,
          borderRadius: 1,
          minWidth: 300
        }}>
          <Typography variant="h6" mb={2}>Create Draft</Typography>
          <TextField
            label="Draft Name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Year"
            type="number"
            value={draftYear}
            onChange={(e) => setDraftYear(Number(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateDraft}>Create</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default DraftDashboard;