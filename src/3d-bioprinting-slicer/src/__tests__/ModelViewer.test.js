import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-three-fiber Canvas and useFrame to avoid WebGL in tests
jest.mock('@react-three/fiber', () => ({
  __esModule: true,
  // Do not render children to avoid custom tags like <ambientLight /> in jsdom
  Canvas: ({ ...rest }) => <div data-testid="r3f-canvas" {...rest} />,
  useFrame: () => {},
}));

// Mock three-drei helpers used by the component
jest.mock('@react-three/drei', () => ({
  __esModule: true,
  Environment: () => <div data-testid="env" />,
  OrbitControls: () => <div data-testid="orbit" />,
}));

import ModelViewer from '../ModelViewer';

describe('ModelViewer', () => {
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;
  let consoleErrorSpy;

  beforeAll(() => {
    // @ts-ignore
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    // @ts-ignore
    URL.revokeObjectURL = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
    consoleErrorSpy.mockRestore();
  });

  test('renders Canvas wrapper when no file provided', () => {
    render(<ModelViewer />);
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  test('shows error for unsupported file type', async () => {
    const badFile = new File(['dummy'], 'bad.txt', { type: 'text/plain' });
    render(<ModelViewer file={badFile} />);
    expect(
      await screen.findByText(/Unsupported format\. Use STL, OBJ, GLB, or GLTF\./i)
    ).toBeInTheDocument();
  });
});
