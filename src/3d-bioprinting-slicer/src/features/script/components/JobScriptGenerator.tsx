import { Button, Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { requestGenerateScript } from '../slice/scriptThunks';

export default function JobScriptGenerator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.script.status);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Generate Job Script</Typography>
      <Button
        variant="contained"
        onClick={() => dispatch(requestGenerateScript())}
        disabled={status === 'pending'}
      >
        {status === 'pending' ? 'Generating…' : 'Generate'}
      </Button>
    </Stack>
  );
}


