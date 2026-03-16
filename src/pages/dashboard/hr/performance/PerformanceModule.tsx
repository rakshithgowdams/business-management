import { Routes, Route, Navigate } from 'react-router-dom';
import PerformanceOverview from './PerformanceOverview';
import ReviewForm from './ReviewForm';
import AppraisalForm from './AppraisalForm';
import AppraisalsList from './AppraisalsList';

export default function PerformanceModule() {
  return (
    <Routes>
      <Route index element={<PerformanceOverview />} />
      <Route path="reviews/new" element={<ReviewForm />} />
      <Route path="reviews/:id/edit" element={<ReviewForm />} />
      <Route path="appraisals" element={<AppraisalsList />} />
      <Route path="appraisals/new" element={<AppraisalForm />} />
      <Route path="appraisals/:id/edit" element={<AppraisalForm />} />
    </Routes>
  );
}
