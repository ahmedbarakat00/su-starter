import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { GraduationCap, ClipboardList, ShieldCheck, LayoutDashboard } from "lucide-react";
import StudentPortal from "./pages/student/StudentPortal.jsx";
import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

export default function App() {
  const location = useLocation();
  const active = location.pathname;
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={25} /></div>
          <div><strong>جامعة سيناء</strong><span>نظام إدارة مشاريع التخرج</span></div>
        </div>
        <nav className="main-nav" aria-label="التنقل الرئيسي">
          <NavLink to="/" end className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><GraduationCap size={17}/> الطالب</NavLink>
          <NavLink to="/doctor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><ClipboardList size={17}/> الدكتور</NavLink>
          <NavLink to="/admin" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><ShieldCheck size={17}/> الأدمن</NavLink>
        </nav>
      </header>
      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<StudentPortal />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer"><span>نظام إدارة مشاريع التخرج</span><span>نسخة واجهة تجريبية — البيانات محفوظة محليًا في هذا المتصفح</span></footer>
    </div>
  );
}