import { Box, Divider, IconButton, Stack, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setBayMetadata } from '../../features/layout/slice/layoutSlice';
import PhysicsParamsForm from '../../features/slicing/components/PhysicsParamsForm';

export default function ConfigurationPanel() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.layout.selectedBayId);
  const bay = useAppSelector((s) => s.layout.bays.find((b) => b.id === selectedId));

  return (
    <Box sx={{ p: 3, width: 340, position: 'fixed', right: 0, top: 0, bottom: 0, borderLeft: '1px solid #374151', bgcolor: '#171717' }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Bay {selectedId ?? '-'} </Typography>
          <Box>

          </Box>
        </Stack>
        <Divider sx={{ borderColor: '#374151' }} />
        {/* Container selector moved to Well Configuration page. */}

        <Divider sx={{ borderColor: '#374151' }} />
        <Accordion disableGutters sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 40 }}>
            <Stack>
              <Typography variant="subtitle1">Physics Parameters</Typography>
              <Typography variant="body2" color="text.secondary">Advanced meniscus modeling</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pb: 0 }}>
            <PhysicsParamsForm renderHeader={false} />
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}


