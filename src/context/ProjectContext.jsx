import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ProjectContext = createContext(null);
const STORAGE_KEY = "sinai-graduation-system-v1";

const initialData = {
  settings: { minMembers: 2, maxMembers: 5, maxTeamsPerDoctor: 8, registrationOpen: true },
  doctors: [
    { id: "doc-1", name: "د. أحمد محمد", email: "ahmed@example.edu", active: true },
    { id: "doc-2", name: "د. سارة محمود", email: "sara@example.edu", active: true },
    { id: "doc-3", name: "د. محمد إبراهيم", email: "mohamed@example.edu", active: true }
  ],
  projects: [],
  audit: []
};

function readInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
  } catch {
    return initialData;
  }
}

export function ProjectProvider({ children }) {
  const [data, setData] = useState(readInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addAudit = (audit, entry) => [
    { id: crypto.randomUUID(), at: new Date().toISOString(), ...entry },
    ...audit
  ];

  const submitProject = (project, actor = "الطالب") => {
    const id = crypto.randomUUID();
    const record = {
      ...project,
      id,
      status: "قيد المراجعة",
      reviewStatus: "بانتظار المراجعة",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), actor, action: "تسجيل المشروع", note: "تم إنشاء تسجيل المشروع." }]
    };
    setData(current => ({
      ...current,
      projects: [record, ...current.projects],
      audit: addAudit(current.audit, { actor, action: "تسجيل مشروع", projectTitle: record.title, projectId: id })
    }));
    return record;
  };

  const updateProject = (id, updates, actor = "الأدمن", action = "تعديل بيانات المشروع") => {
    setData(current => {
      const projects = current.projects.map(p => {
        if (p.id !== id) return p;
        const historyEntry = { id: crypto.randomUUID(), at: new Date().toISOString(), actor, action, note: "تم تحديث بيانات المشروع." };
        return { ...p, ...updates, updatedAt: new Date().toISOString(), history: [historyEntry, ...(p.history || [])] };
      });
      const title = projects.find(p => p.id === id)?.title || "";
      return { ...current, projects, audit: addAudit(current.audit, { actor, action, projectTitle: title, projectId: id }) };
    });
  };

  const reviewProject = (id, decision, reason = "", actor = "الدكتور") => {
    setData(current => {
      const projects = current.projects.map(p => {
        if (p.id !== id) return p;
        const accepted = decision === "قبول";
        const historyEntry = { id: crypto.randomUUID(), at: new Date().toISOString(), actor, action: accepted ? "قبول المشروع" : "رفض المشروع", note: accepted ? "تم قبول المشروع." : reason };
        return {
          ...p,
          status: accepted ? "مقبول" : "مرفوض",
          reviewStatus: accepted ? "تمت الموافقة" : "مرفوض — يحتاج إجراء",
          rejectionReason: accepted ? "" : reason,
          updatedAt: new Date().toISOString(),
          history: [historyEntry, ...(p.history || [])]
        };
      });
      const project = projects.find(p => p.id === id);
      return { ...current, projects, audit: addAudit(current.audit, { actor, action: decision === "قبول" ? "قبول مشروع" : "رفض مشروع", projectTitle: project?.title || "", projectId: id, note: reason }) };
    });
  };

  const reassignProject = (id, doctorId, actor = "الأدمن") => {
    const doctor = data.doctors.find(d => d.id === doctorId);
    if (!doctor || !doctor.active) return { ok: false, message: "اختر دكتورًا نشطًا." };
    const assigned = data.projects.filter(p => p.doctorId === doctorId && p.status !== "مرفوض").length;
    if (assigned >= data.settings.maxTeamsPerDoctor) return { ok: false, message: "الدكتور وصل للحد الأقصى للفرق المسندة إليه." };
    updateProject(id, { doctorId, status: "قيد المراجعة", reviewStatus: "بانتظار المراجعة", rejectionReason: "" }, actor, "إعادة إسناد المشروع");
    return { ok: true };
  };

  const addDoctor = doctor => {
    setData(current => ({
      ...current,
      doctors: [...current.doctors, { ...doctor, id: crypto.randomUUID(), active: true }],
      audit: addAudit(current.audit, { actor: "الأدمن", action: "إضافة دكتور", projectTitle: doctor.name })
    }));
  };

  const updateDoctor = (id, updates) => {
    setData(current => ({
      ...current,
      doctors: current.doctors.map(d => d.id === id ? { ...d, ...updates } : d),
      audit: addAudit(current.audit, { actor: "الأدمن", action: "تعديل بيانات دكتور", projectTitle: current.doctors.find(d => d.id === id)?.name || "" })
    }));
  };

  const updateSettings = settings => {
    setData(current => ({
      ...current,
      settings: { ...current.settings, ...settings },
      audit: addAudit(current.audit, { actor: "الأدمن", action: "تعديل إعدادات النظام", projectTitle: "إعدادات النظام" })
    }));
  };

  const resetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData({ ...initialData, projects: [], audit: [] });
  };

  const value = useMemo(() => ({
    ...data, submitProject, updateProject, reviewProject, reassignProject,
    addDoctor, updateDoctor, updateSettings, resetDemo
  }), [data]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used inside ProjectProvider");
  return context;
}