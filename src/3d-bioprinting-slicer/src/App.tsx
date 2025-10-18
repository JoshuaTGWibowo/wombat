import './App.css'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import ModelPreview3D from './features/model/components/ModelPreview3D'
import SlicingThumbnails from './features/slicing/components/SlicingThumbnails'
import Notifications from './shared/components/Notifications'
import BayConfigurationView from './features/layout/components/BayConfigurationView'
import WellConfigurationPage from './features/layout/components/WellConfigurationPage'
import ConfigurationPanel from './ui/components/ConfigurationPanel'
import LeftNavbar from './ui/components/LeftNavbar'
import ImportPanel from './ui/components/ImportPanel'
import ReviewPanel from './ui/components/ReviewPanel'
import JobScriptGenerator from './features/script/components/JobScriptGenerator'
import JobScriptViewer from './features/script/components/JobScriptViewer'
import { useAppSelector } from './app/hooks'

function ImportView() {
  const slices = useAppSelector((s) => s.slicing.slices)
  const hasSlices = !!(slices && slices.length > 0)
  return (
    <>
      <Box sx={{ ml: '64px', mr: '340px' }}>
        {/* Show slices grid if available; else show 3D preview */}
        {hasSlices ? <SlicingThumbnails /> : <ModelPreview3D />}
      </Box>
      {hasSlices ? <ReviewPanel /> : <ImportPanel />}
    </>
  )
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Container maxWidth={false} disableGutters sx={{ m: 0, p: 0 }}>
          <LeftNavbar />
          <Routes>
            <Route path="/import" element={<ImportView />} />
            <Route
              path="/layout"
              element={
                <Box sx={{ ml: '64px', mr: '340px' }}>
                  <BayConfigurationView />
                  <ConfigurationPanel />
                </Box>
              }
            />
            <Route
              path="/well"
              element={
                <Box sx={{ ml: '64px', mr: '340px' }}>
                  <WellConfigurationPage />
                  <ConfigurationPanel />
                </Box>
              }
            />
            <Route
              path="/script"
              element={
                <Box sx={{ ml: '64px', mr: '340px', p: 3 }}>
                  <JobScriptGenerator />
                  <JobScriptViewer />
                </Box>
              }
            />
            <Route path="/" element={<Navigate to="/import" replace />} />
          </Routes>
          <Notifications />
        </Container>
      </BrowserRouter>
    </Provider>
  )
}

export default App
