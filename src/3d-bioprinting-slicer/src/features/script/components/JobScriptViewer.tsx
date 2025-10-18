import { Button, Dialog, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAppSelector } from '../../../app/hooks';

export default function JobScriptViewer() {
  const script = useAppSelector((s) => s.script.script);
  const [open, setOpen] = useState(false);
  const text = useMemo(() => script ?? '', [script]);

  if (!script) return null;

  return (
    <>
      <Dialog open={!open} onClose={() => setOpen(true)} />
      <Dialog open onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Generated Script</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField value={text} multiline minRows={12} maxRows={24} fullWidth />
            <Stack direction="row" spacing={1}>
              <Button
                onClick={() => navigator.clipboard.writeText(text)}
                variant="outlined"
              >
                Copy
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  const blob = new Blob([text], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'job-script.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download JSON
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}


