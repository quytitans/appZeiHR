import { Route, Routes } from "react-router-dom";

import { UsersPage } from "@/features/admin/UsersPage";
import { AttendancePage } from "@/features/attendance/AttendancePage";
import { LoginPage } from "@/features/auth/LoginPage";
import { BenefitsPage } from "@/features/benefits/BenefitsPage";
import { ContractsPage } from "@/features/contracts/ContractsPage";
import { HomePage } from "@/features/dashboard/HomePage";
import { PersonnelPage } from "@/features/personnel/PersonnelPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/personnel" element={<PersonnelPage />} />
      <Route path="/contracts" element={<ContractsPage />} />
      <Route path="/benefits" element={<BenefitsPage />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="/admin/users" element={<UsersPage />} />
    </Routes>
  );
}
