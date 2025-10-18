import type { ChangeEvent, DragEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAppDispatch } from '../../../app/hooks';
import {
  uploadModelFailed,
  uploadModelRequested,
  uploadModelSucceeded,
} from '../slice/modelSlice';

const ACCEPTED_TYPES = ['.stl', '.obj'];

function isValidFile(file: File) {
  const lower = file.name.toLowerCase();
  return ACCEPTED_TYPES.some((ext) => lower.endsWith(ext));
}

export default function ModelUploader() {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!isValidFile(file)) {
        const message = 'Invalid file type. Please upload .stl or .obj.';
        setError(message);
        dispatch(uploadModelFailed(message));
        return;
      }
      setError(null);
      dispatch(uploadModelRequested());
      // For Epic 1, we only store the file in state; server parsing happens at slice time.
      dispatch(uploadModelSucceeded({ modelData: file }));
      setFileName(file.name);
      setFileSize(file.size);
    },
    [dispatch],
  );

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHover(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!isValidFile(file)) {
      const message = 'Invalid file type. Please upload .stl or .obj.';
      setError(message);
      dispatch(uploadModelFailed(message));
      return;
    }
    setError(null);
    dispatch(uploadModelRequested());
    dispatch(uploadModelSucceeded({ modelData: file }));
    setFileName(file.name);
    setFileSize(file.size);
  }, [dispatch]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setHover(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHover(false);
  }, []);

  const formattedSize = useMemo(() => {
    if (!fileSize && fileSize !== 0) return null;
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = fileSize;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size = size / 1024;
      unitIndex++;
    }
    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
  }, [fileSize]);

  return (
    <Box
      sx={{
        border: hover ? '2px dashed #3b82f6' : '1px dashed #2a2c35',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,
        bgcolor: 'background.paper',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      aria-label="Upload 3D model by clicking or dragging a file"
      tabIndex={0}
    >
      <CloudUploadIcon color="primary" fontSize="medium" />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        hidden
        onChange={onFileChange}
      />
      <Button
        variant="contained"
        size="small"
        onClick={() => inputRef.current?.click()}
        aria-label="Upload model"
      >
        Choose File
      </Button>
      <Typography variant="caption" color="text.secondary">
        STL or OBJ
      </Typography>
      {fileName && (
        <Typography variant="caption" color="text.secondary">
          {fileName}{formattedSize ? ` • ${formattedSize}` : ''}
        </Typography>
      )}
      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}
    </Box>
  );
}


