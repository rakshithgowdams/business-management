import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Plus, Briefcase, Users } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import JobPostings from './JobPostings';
import ApplicationPipeline from './ApplicationPipeline';
import JobPostingForm from './JobPostingForm';
import ApplicationForm from './ApplicationForm';

export default function HiringModule() {
  return (
    <Routes>
      <Route index element={<Navigate to="jobs" replace />} />
      <Route path="jobs" element={<JobPostings />} />
      <Route path="jobs/new" element={<JobPostingForm />} />
      <Route path="jobs/:id/edit" element={<JobPostingForm />} />
      <Route path="pipeline" element={<ApplicationPipeline />} />
      <Route path="applications/new" element={<ApplicationForm />} />
      <Route path="applications/:id/edit" element={<ApplicationForm />} />
    </Routes>
  );
}
