import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setWellType, type WellType, WellTypes } from '../slice/layoutSlice';

export default function ContainerSelector() {
  const dispatch = useAppDispatch();
  const value = useAppSelector((s) => s.layout.wellType);
  return (
    <FormControl fullWidth>
      <InputLabel id="container-type-label">Container</InputLabel>
      <Select
        labelId="container-type-label"
        label="Container"
        value={value}
        onChange={(e) => dispatch(setWellType(e.target.value as WellType))}
      >
        <MenuItem value={WellTypes.PLATE_6}>6-Well Plate</MenuItem>
        <MenuItem value={WellTypes.PLATE_24}>24-Well Plate</MenuItem>
        <MenuItem value={WellTypes.PLATE_96}>96-Well Plate</MenuItem>
      </Select>
    </FormControl>
  );
}
