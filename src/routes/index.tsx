import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { IdentitySelector } from '../features/identity/IdentitySelector';
import { ScheduleSelector } from '../features/schedule/ScheduleSelector';
import { ChecklistPage } from '../features/checklist/ui/ChecklistPage';
import { AdminPage } from '../features/admin/ui/AdminPage';

export function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<IdentitySelector />} />
      <Route path="/schedule" element={<ScheduleSelector />} />
      <Route path="/checklist" element={<ChecklistPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
