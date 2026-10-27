import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Trash2, UserRound, Users, GraduationCap, ClipboardList } from "lucide-react";
import { useProjects } from "../../context/ProjectContext.jsx";

const blankMember = () => ({ name: "", studentId: "", email: "", leader: false });

export default function StudentPortal() {
  const { doctors, settings, projects, submitProject } = useProjects();
  const [form, setForm] = useState({
    title: "", summary: "", objectives: "", studentEmail: "", studentPhone: "",
    doctorId: "", members: [ { ...blankMember(), leader: true }, blankMember() ]
  });
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState({});

  const activeDoctors = useMemo(() => doctors.filter(d => d.active), [doctors]);
  const availableDoctors = activeDoctors.filter(d => projects.filter(p => p.doctorId === d.id && p.status !== "مرفوض").length < settings.maxTeamsPerDoctor);

  const setField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const updateMember = (index, field, value) => setForm(current => ({
    ...current,
    members: current.members.map((m, i) => i === index ? { ...m, [field]: value } : field === "leader" ? { ...m, leader: false } : m)
  }));
  const addMember = () => {
    if (form.members.length >= settings.maxMembers) return;
    setForm(current => ({ ...current, members: [...current.members, blankMember()] }));
  };
  const removeMember = index => {
    if (form.members.length <= settings.minMembers) return;
    setForm(current => {
      const members = current.members.filter((_, i) => i !== index);
      if (!members.some(m => m.leader) && members.length) members[0].leader = true;
      return { ...current, members };
    });
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "اكتب اسم المشروع.";
    if (!form.summary.trim()) next.summary = "اكتب نبذة عن المشروع.";
    if (!form.objectives.trim()) next.objectives = "اكتب أهداف المشروع.";
    if (!form.studentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.studentEmail)) next.studentEmail = "أدخل بريدًا إلكترونيًا صحيحًا.";
    if (!form.studentPhone.trim()) next.studentPhone = "أدخل رقم الهاتف.";
    if (!form.doctorId) next.doctorId = "اختر الدكتور المسؤول.";
    if (form.members.length < settings.minMembers || form.members.length > settings.maxMembers) next.members = `عدد الأعضاء يجب أن يكون من ${settings.minMembers} إلى ${settings.maxMembers}.`;
    if (form.members.some(m => !m.name.trim() || !m.studentId.trim() || !m.email.trim())) next.members = "أكمل الاسم والرقم الجامعي والبريد لكل عضو.";
    if (new Set(form.members.map(m => m.studentId.trim())).size !== form.members.length) next.members = "لا يمكن تكرار الرقم الجامعي داخل الفريق.";
    if (form.members.filter(m => m.leader).length !== 1) next.members = "حدد قائدًا واحدًا فقط للفريق.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = event => {
    event.preventDefault();
    setNotice("");
    if (!settings.registrationOpen) { setNotice("التسجيل مغلق حاليًا بواسطة الأدمن."); return; }
    if (!validate()) return;
    const assigned = projects.filter(p => p.doctorId === form.doctorId && p.status !== "مرفوض").length;
    if (assigned >= settings.maxTeamsPerDoctor) { setNotice("الدكتور المختار وصل للحد الأقصى. اختر دكتورًا آخر."); return; }
    const project = submitProject({ ...form, members: form.members.map(m => ({ ...m })), leaderStudentId: form.members.find(m => m.leader)?.studentId });
    setNotice(`تم تسجيل المشروع "${project.title}" بنجاح. رقم التسجيل: ${project.id.slice(0, 8)}`);
    setForm({ title: "", summary: "", objectives: "", studentEmail: "", studentPhone: "", doctorId: "", members: [{ ...blankMember(), leader: true }, blankMember()] });
    setErrors({});
  };

  const myProjects = projects.filter(p => p.members.some(m => m.email.toLowerCase() === form.studentEmail.toLowerCase()) && form.studentEmail.trim());

  return (
    <div className="stack-lg">
      <section className="hero">
        <div><span className="eyebrow">بوابة الطالب</span><h1>تسجيل مشروع التخرج</h1><p>املأ جميع البيانات المطلوبة لتسجيل مشروع فريقك ومتابعة حالته.</p></div>
        <div className="hero-icon"><GraduationCapFallback /></div>
      </section>

      {!settings.registrationOpen && <div className="alert warning">التسجيل مغلق حاليًا. يمكنك مراجعة بياناتك، لكن لا يمكن إرسال تسجيل جديد.</div>}
      {notice && <div className="alert success"><CheckCircle2 size={19}/>{notice}</div>}

      <form className="panel form-panel stack-lg" onSubmit={handleSubmit} noValidate>
        <SectionTitle icon={<ClipboardFallback />} title="بيانات المشروع" subtitle="كل الحقول المعلّمة بنجمة مطلوبة." />
        <div className="field-grid">
          <Field label="اسم المشروع *" error={errors.title}><input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="مثال: منصة إدارة مشاريع التخرج" /></Field>
          <Field label="الدكتور المسؤول *" error={errors.doctorId}><select value={form.doctorId} onChange={e => setField("doctorId", e.target.value)}><option value="">اختر الدكتور</option>{availableDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="بريد قائد الفريق للتواصل *" error={errors.studentEmail}><input type="email" value={form.studentEmail} onChange={e => setField("studentEmail", e.target.value)} placeholder="student@university.edu" /></Field>
          <Field label="رقم هاتف قائد الفريق *" error={errors.studentPhone}><input value={form.studentPhone} onChange={e => setField("studentPhone", e.target.value)} placeholder="01xxxxxxxxx" /></Field>
          <Field className="full" label="نبذة عن المشروع *" error={errors.summary}><textarea rows="3" value={form.summary} onChange={e => setField("summary", e.target.value)} placeholder="اشرح فكرة المشروع والمشكلة التي يعالجها." /></Field>
          <Field className="full" label="أهداف المشروع *" error={errors.objectives}><textarea rows="3" value={form.objectives} onChange={e => setField("objectives", e.target.value)} placeholder="اكتب أهداف المشروع الأساسية." /></Field>
        </div>

        <div className="section-divider" />
        <div className="section-heading-row">
          <SectionTitle icon={<Users size={21}/>} title="أعضاء الفريق" subtitle={`عدد الأعضاء المسموح به: ${settings.minMembers} إلى ${settings.maxMembers}.`} />
          <button type="button" className="btn secondary" onClick={addMember} disabled={form.members.length >= settings.maxMembers}><Plus size={17}/> إضافة عضو</button>
        </div>
        {errors.members && <p className="field-error">{errors.members}</p>}
        <div className="members-grid">
          {form.members.map((member, index) => (
            <div className="member-card" key={index}>
              <div className="member-card-top"><span className="member-number">العضو {index + 1}</span>{form.members.length > settings.minMembers && <button className="icon-btn danger-text" type="button" onClick={() => removeMember(index)} aria-label="حذف العضو"><Trash2 size={16}/></button>}</div>
              <Field label="الاسم الكامل *"><input value={member.name} onChange={e => updateMember(index, "name", e.target.value)} placeholder="اسم الطالب" /></Field>
              <Field label="الرقم الجامعي *"><input value={member.studentId} onChange={e => updateMember(index, "studentId", e.target.value)} placeholder="الرقم المرجعي / الجامعي" /></Field>
              <Field label="البريد الإلكتروني *"><input type="email" value={member.email} onChange={e => updateMember(index, "email", e.target.value)} placeholder="student@university.edu" /></Field>
              <label className="radio-line"><input type="radio" name="teamLeader" checked={member.leader} onChange={() => updateMember(index, "leader", true)} /> قائد الفريق</label>
            </div>
          ))}
        </div>
        <div className="form-footer"><span className="muted"><UserRound size={15}/> راجع الأرقام الجامعية قبل الإرسال.</span><button className="btn primary" type="submit">إرسال التسجيل <span>←</span></button></div>
      </form>

      <section className="panel">
        <SectionTitle icon={<ClipboardFallback />} title="متابعة تسجيل" subtitle="اكتب بريد قائد الفريق المستخدم عند التسجيل لعرض تسجيلاته في هذا المتصفح." />
        <ProjectLookup projects={projects} />
      </section>
    </div>
  );
}

function ProjectLookup({ projects }) {
  const [email, setEmail] = useState("");
  const results = projects.filter(p => p.studentEmail.toLowerCase() === email.trim().toLowerCase() || p.members.some(m => m.email.toLowerCase() === email.trim().toLowerCase()));
  return <div className="lookup-row"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني لقائد الفريق أو أحد الأعضاء" /><div className="lookup-results">{email && (results.length ? results.map(p => <div className="lookup-item" key={p.id}><div><strong>{p.title}</strong><span>رقم التسجيل: {p.id.slice(0, 8)} · الدكتور: {p.doctorName || "راجع الإسناد في لوحة الأدمن"}</span>{p.rejectionReason && <span className="danger-text">سبب الرفض: {p.rejectionReason}</span>}</div><Status status={p.status}/></div>) : <p className="muted">لا توجد تسجيلات بهذا البريد.</p>)}</div></div>;
}

function Field({ label, error, className = "", children }) { return <div className={`field ${className}`}><label>{label}</label>{children}{error && <small className="field-error">{error}</small>}</div>; }
function SectionTitle({ icon, title, subtitle }) { return <div className="section-title"><div className="section-title-icon">{icon}</div><div><h2>{title}</h2><p>{subtitle}</p></div></div>; }
function Status({ status }) { const cls = status === "مقبول" ? "accepted" : status === "مرفوض" ? "rejected" : "pending"; return <span className={`status-pill ${cls}`}>{status}</span>; }
function ClipboardFallback() { return <ClipboardList size={21}/>; }
function GraduationCapFallback() { return <GraduationCap size={32}/>; }