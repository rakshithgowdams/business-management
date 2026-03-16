import { Routes, Route, Navigate } from 'react-router-dom';
import LeaveOverview from './LeaveOverview';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveTypesManager from './LeaveTypesManager';

export default function LeaveModule() {
  return (
    <Routes>
      <Route index element={<LeaveOverview />} />
      <Route path="new" element={<LeaveRequestForm />} />
      <Route path=":id/edit" element={<LeaveRequestForm />} />
      <Route path="types" element={<LeaveTypesManager />} />
    </Routes>
  );
}
