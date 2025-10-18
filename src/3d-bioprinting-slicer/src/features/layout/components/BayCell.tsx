import { memo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setSelectedBay } from '../slice/layoutSlice';
import { useNavigate } from 'react-router-dom';

interface Props {
  id: number;
}

function BayCellComponent({ id }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedId = useAppSelector((s) => s.layout.selectedBayId);
  const configured = useAppSelector((s) => s.layout.bays.find((b) => b.id === id)?.configured);
  const isSelected = selectedId === id;

  const onClick = useCallback(() => {
    dispatch(setSelectedBay(id));
    navigate('/well');
  }, [dispatch, id, navigate]);

  return (
    <Box
      role="gridcell"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 2,
        border: '1px solid #374151',
        bgcolor: 'background.paper',
        outline: isSelected ? '2px solid #8B5CF6' : 'none',
        boxShadow: isSelected ? '0 0 0 4px rgba(139,92,246,.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
        position: 'relative',
        cursor: 'pointer',
        '&:hover': { borderColor: '#6B7280' },
        '&:focus-visible': { outline: '2px solid #8B5CF6', boxShadow: '0 0 0 4px rgba(139,92,246,.2)' },
      }}
    >
      <Typography variant="h4">{id}</Typography>
      {configured && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
      )}
    </Box>
  );
}

export default memo(BayCellComponent);
