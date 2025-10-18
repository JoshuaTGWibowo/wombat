import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders upload UI and stepper', () => {
  render(<App />);

  // Upload control
  const fileInput = screen.getByLabelText(/upload model/i);
  expect(fileInput).toBeInTheDocument();
  expect(fileInput).toHaveAttribute('accept', '.stl,.obj,.glb,.gltf');

  // Stepper shown on the homepage as a progressbar
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
