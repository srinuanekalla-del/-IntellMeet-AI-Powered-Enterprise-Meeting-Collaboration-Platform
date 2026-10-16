import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LobbyPage } from '@/pages/LobbyPage';
import { MeetingRoomPage } from '@/pages/MeetingRoomPage';
import PostMeetingDashboard from '@/pages/PostMeetingDashboard';
import ProjectBoard from '@/pages/ProjectBoard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/summaries" element={<PostMeetingDashboard />} />
          <Route path="/projects" element={<ProjectBoard />} />
          <Route path="/lobby/:roomId" element={<LobbyPage />} />
          <Route path="/meeting/:roomId" element={<MeetingRoomPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
