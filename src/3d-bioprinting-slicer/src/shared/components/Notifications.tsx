import { Snackbar, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { dismissNotification } from '../../features/ui/slice/uiSlice';

export default function Notifications() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.ui.notifications);
  const latest = notifications[notifications.length - 1];

  if (!latest) return null;

  const onClose = () => dispatch(dismissNotification(latest.id));

  return (
    <Snackbar open autoHideDuration={4000} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={onClose} severity={latest.severity} variant="filled" sx={{ width: '100%' }}>
        {latest.message}
      </Alert>
    </Snackbar>
  );
}


