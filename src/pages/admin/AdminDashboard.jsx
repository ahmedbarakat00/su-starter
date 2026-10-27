import { useMemo, useState } from "react";
import { Activity, Plus, Search, Users, UserRound, FolderKanban, Settings, Pencil, UserCheck, UserX, RotateCcw, X, Save } from "lucide-react";
import { useProjects } from "../../context/ProjectContext.jsx";

const blankForm = () => ({ title: "", summary: "", objectives: "", studentEmail: "", studentPhone: "", doctorId: "", members: [{ name: "", studentId: "", email: "", leader: true }, { name: "", studentId: "", email: "", leader: false }] });

export default function AdminDashboard() {
  const { projects, doctors, settings, audit, addDoctor, updateDoctor, updateSettings, submitProject, updateProject, reassignProject, resetDemo } = useProjects();
  const [tab, setTab] = useState("projects");
  const [search, setSearch] = useState("");
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: "", email: "" });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [settingsDraft, setSettingsDraft] = useState(settings);

  const filtered = useMemo(() => projects.filter(p => `${p.title} ${p.members.map(m => m.name + " " + m.studentId).join(" ")} ${doctors.find(d => d.id === p.doctorId)?.name || ""}`.toLowerCase().includes(search.toLowerCase())), [projects, search, doctors]);
  const doctorName = id => doctors.find(d => d.id === id)?.name || "غير مسند";
  const activeDoctors = doctors.filter(d => d.active);
  const capacity = id => projects.filter(p => p.doctorId === id && p.status !== "مرفوض").length;

  const openNew = () => { setEditing(null); setForm(blankForm()); setFormError(""); setTab("projects"); document.getElementById("project-editor")?.scrollIntoView({ behavior: "smooth" }); };
  const openEdit = p => { setEditing(p.id); setForm({ title: p.title, summary: p.summary, objectives: p.objectives, studentEmail: p.studentEmail, studentPhone: p.studentPhone, doctorId: p.doctorId, members: p.members.map(m => ({ ...m })) }); setFormError(""); document.getElementById("project-editor")?.scrollIntoView({ behavior: "smooth" }); };
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const setMember = (i, key, value) => setForm(current => ({ ...current, members: current.members.map((m, index) => index === i ? { ...m, [key]: value } : key === "leader" ? { ...m, leader: false } : m) }));
  const validateForm = () => {
    if (!form.title.trim() || !form.summary.trim() || !form.objectives.trim() || !form.studentEmail.trim() || !form.studentPhone.trim() || !form.doctorId) return "كل بيانات المشروع وبيانات التواصل واختيار الدكتور مطلوبة.";
    if (form.members.length < settings.minMembers || form.members.length > settings.maxMembers) return `عدد الأعضاء يجب أن يكون بين ${settings.minMembers} و${settings.maxMembers}.`;
    if (form.members.some(m => !m.name.trim() || !m.studentId.trim() || !m.email.trim())) return "أكمل اسم ورقم جامعي وبريد كل عضو.";
    if (new Set(form.members.map(m => m.studentId.trim())).size !== form.members.length) return "الرقم الجامعي لا يمكن تكراره داخل الفريق.";
    if (form.members.filter(m => m.leader).length !== 1) return "يجب تحديد قائد واحد فقط.";
    const doc = doctors.find(d => d.id === form.doctorId);
    if (!doc || !doc.active) return "اختر دكتورًا نشطًا.";
    if (!editing && capacity(doc.id) >= settings.maxTeamsPerDoctor) return "الدكتور المختار وصل للحد الأقصى.";
    return "";
  };
  const saveProject = e => {
    e.preventDefault();
    const error = validateForm();
    if (error) { setFormError(error); return; }
    if (editing) {
      updateProject(editing, { ...form, members: form.members.map(m => ({ ...m })), leaderStudentId: form.members.find(m => m.leader)?.studentId }, "الأدمن", "تعديل بيانات المشروع");
      setMessage("تم حفظ تعديلات المشروع.");
    } else {
      submitProject({ ...form, members: form.members.map(m => ({ ...m })), leaderStudentId: form.members.find(m => m.leader)?.studentId }, "الأدمن");
      setMessage("تم إنشاء تسجيل المشروع نيابة عن الطالب.");
    }
    setForm(blankForm()); setEditing(null); setFormError("");
  };
  const reassign = (p, doctorId) => {
    const result = reassignProject(p.id, doctorId);
    setMessage(result.ok ? "تم إعادة إسناد المشروع." : result.message);
  };
  const changeSettings = e => { e.preventDefault(); if (settingsDraft.minMembers < 1 || settingsDraft.maxMembers < settingsDraft.minMembers || settingsDraft.maxTeamsPerDoctor < 1) { setMessage("راجع حدود الأعضاء وسعة الدكتور."); return; } updateSettings(settingsDraft); setMessage("تم حفظ إعدادات النظام."); };

  return <div className="stack-lg">
    <section className="hero"><div><span className="eyebrow">لوحة الإدارة</span><h1>إدارة مشاريع التخرج</h1><p>إدارة المشاريع والفرق والدكاترة وإعدادات النظام من مكان واحد.</p></div><div className="hero-icon"><Settings size={34}/></div></section>
    {message && <div className="alert info">{message}<button className="icon-btn" onClick={() => setMessage("")}><X size={16}/></button></div>}
    <section className="stats-grid">
      <Stat icon={<Users/>} label="إجمالي الدكاترة" value={doctors.length} detail={`${activeDoctors.length} نشط`}/>
      <Stat icon={<FolderKanban/>} label="إجمالي المشاريع" value={projects.length} detail={`${projects.filter(p => p.status === "قيد المراجعة").length} قيد المراجعة`}/>
      <Stat icon={<UserRound/>} label="الطلاب المسجلون" value={new Set(projects.flatMap(p => p.members.map(m => m.studentId))).size} detail="أرقام جامعية فريدة"/>
      <Stat icon={<Activity/>} label="مقبول / مرفوض" value={`${projects.filter(p => p.status === "مقبول").length} / ${projects.filter(p => p.status === "مرفوض").length}`} detail="حسب حالة المشروع"/>
    </section>
    <div className="tabs">
      <button className={tab === "projects" ? "tab active" : "tab"} onClick={() => setTab("projects")}><FolderKanban size={17}/> المشاريع والفرق</button>
      <button className={tab === "doctors" ? "tab active" : "tab"} onClick={() => setTab("doctors")}><Users size={17}/> إدارة الدكاترة</button>
      <button className={tab === "settings" ? "tab active" : "tab"} onClick={() => setTab("settings")}><Settings size={17}/> إعدادات النظام</button>
      <button className={tab === "audit" ? "tab active" : "tab"} onClick={() => setTab("audit")}><Activity size={17}/> سجل العمليات</button>
    </div>

    {tab === "projects" && <section className="panel stack-md">
      <div className="section-heading-row"><div><h2>جميع المشاريع</h2><p className="muted">عرض وتعديل التسجيلات وإعادة الإسناد.</p></div><button className="btn primary" onClick={openNew}><Plus size={17}/> تسجيل مشروع نيابة عن طالب</button></div>
      <div className="search-box wide"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم المشروع أو الطالب أو الرقم الجامعي أو الدكتور"/></div>
      {filtered.length === 0 ? <Empty text="لا توجد مشاريع حتى الآن. يمكنك تسجيل مشروع نيابة عن طالب."/> : <div className="table-wrap"><table><thead><tr><th>المشروع</th><th>قائد الفريق</th><th>الرقم الجامعي</th><th>أعضاء الفريق</th><th>الدكتور</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><strong>{p.title}</strong><small className="table-sub">{p.summary}</small></td><td>{p.members.find(m => m.leader)?.name || "—"}</td><td>{p.members.find(m => m.leader)?.studentId || "—"}</td><td>{p.members.length}</td><td>{doctorName(p.doctorId)}</td><td><Status status={p.status}/></td><td><div className="table-actions"><button className="icon-btn" title="تعديل المشروع" onClick={() => openEdit(p)}><Pencil size={16}/></button><select aria-label="إعادة إسناد الدكتور" value={p.doctorId || ""} onChange={e => e.target.value && reassign(p, e.target.value)}><option value="">إعادة إسناد...</option>{activeDoctors.filter(d => d.id !== p.doctorId).map(d => <option key={d.id} value={d.id}>{d.name} ({capacity(d.id)}/{settings.maxTeamsPerDoctor})</option>)}</select></div></td></tr>)}</tbody></table></div>}
      <div id="project-editor" className="editor-card"><div className="section-heading-row"><div><h2>{editing ? "تعديل تسجيل المشروع" : "تسجيل مشروع جديد"}</h2><p className="muted">الأدمن يستطيع إنشاء التسجيل وتعديل جميع حقوله.</p></div>{editing && <button className="btn secondary" onClick={() => {setEditing(null);setForm(blankForm());}}><X size={16}/> إلغاء التعديل</button>}</div>
        {formError && <div className="alert error">{formError}</div>}
        <form className="stack-md" onSubmit={saveProject}>
          <div className="field-grid"><Field label="اسم المشروع *"><input value={form.title} onChange={e => setField("title", e.target.value)} required/></Field><Field label="الدكتور المسؤول *"><select value={form.doctorId} onChange={e => setField("doctorId", e.target.value)} required><option value="">اختر الدكتور</option>{activeDoctors.map(d => <option key={d.id} value={d.id}>{d.name} — {capacity(d.id)}/{settings.maxTeamsPerDoctor}</option>)}</select></Field><Field label="بريد قائد الفريق *"><input type="email" value={form.studentEmail} onChange={e => setField("studentEmail", e.target.value)} required/></Field><Field label="هاتف قائد الفريق *"><input value={form.studentPhone} onChange={e => setField("studentPhone", e.target.value)} required/></Field><Field className="full" label="نبذة المشروع *"><textarea rows="2" value={form.summary} onChange={e => setField("summary", e.target.value)} required/></Field><Field className="full" label="أهداف المشروع *"><textarea rows="2" value={form.objectives} onChange={e => setField("objectives", e.target.value)} required/></Field></div>
          <div className="section-heading-row"><h3>أعضاء الفريق</h3><button type="button" className="btn secondary" disabled={form.members.length >= settings.maxMembers} onClick={() => setForm(c => ({...c, members:[...c.members, {name:"",studentId:"",email:"",leader:false}]}))}><Plus size={16}/> إضافة عضو</button></div>
          <div className="members-grid">{form.members.map((m, i) => <div className="member-card" key={i}><div className="member-card-top"><span className="member-number">العضو {i+1}</span>{form.members.length > settings.minMembers && <button className="icon-btn danger-text" type="button" onClick={() => setForm(c => {const members=c.members.filter((_,n)=>n!==i); if(!members.some(x=>x.leader)&&members[0]) members[0].leader=true; return {...c,members};})}><X size={16}/></button>}</div><Field label="الاسم *"><input value={m.name} onChange={e => setMember(i,"name",e.target.value)} required/></Field><Field label="الرقم الجامعي *"><input value={m.studentId} onChange={e => setMember(i,"studentId",e.target.value)} required/></Field><Field label="البريد *"><input type="email" value={m.email} onChange={e => setMember(i,"email",e.target.value)} required/></Field><label className="radio-line"><input type="radio" name="adminLeader" checked={m.leader} onChange={() => setMember(i,"leader",true)}/> قائد الفريق</label></div>)}</div>
          <div className="form-footer"><span className="muted">التعديلات تُضاف إلى سجل العمليات.</span><button className="btn primary" type="submit"><Save size={17}/> {editing ? "حفظ التعديلات" : "إنشاء التسجيل"}</button></div>
        </form>
      </div>
    </section>}

    {tab === "doctors" && <section className="panel stack-md"><div className="section-heading-row"><div><h2>إدارة الدكاترة</h2><p className="muted">إضافة الدكاترة وتحديد نشاطهم ومتابعة السعة.</p></div><button className="btn primary" onClick={() => setShowDoctorForm(v => !v)}><Plus size={17}/> إضافة دكتور</button></div>
      {showDoctorForm && <form className="add-doctor-form" onSubmit={e => {e.preventDefault(); if(!doctorForm.name.trim()||!doctorForm.email.trim()) return; addDoctor(doctorForm); setDoctorForm({name:"",email:""}); setShowDoctorForm(false); setMessage("تمت إضافة الدكتور.");}}><Field label="اسم الدكتور *"><input value={doctorForm.name} onChange={e => setDoctorForm(c=>({...c,name:e.target.value}))} required/></Field><Field label="البريد الإلكتروني *"><input type="email" value={doctorForm.email} onChange={e => setDoctorForm(c=>({...c,email:e.target.value}))} required/></Field><button className="btn primary" type="submit">حفظ الدكتور</button></form>}
      <div className="doctor-cards">{doctors.map(d => <article className="doctor-card" key={d.id}><div className="doctor-card-head"><div className="avatar">{d.name.slice(0,1)}</div><div><h3>{d.name}</h3><p>{d.email}</p></div><span className={`status-pill ${d.active ? "accepted" : "rejected"}`}>{d.active ? "نشط" : "معطّل"}</span></div><div className="capacity-line"><span>الفرق المسندة</span><strong>{capacity(d.id)} / {settings.maxTeamsPerDoctor}</strong></div><div className="capacity-bar"><span style={{width:`${Math.min(100,capacity(d.id)/settings.maxTeamsPerDoctor*100)}%`}}/></div><div className="button-row"><button className="btn secondary" onClick={() => {const name=window.prompt("تعديل اسم الدكتور:",d.name); if(name?.trim()) updateDoctor(d.id,{name:name.trim()});}}><Pencil size={15}/> تعديل الاسم</button><button className={`btn ${d.active?"danger":"primary"}`} onClick={() => updateDoctor(d.id,{active:!d.active})}>{d.active?<><UserX size={15}/> تعطيل</>:<><UserCheck size={15}/> تفعيل</>}</button></div><div className="assigned-mini"><strong>المشاريع المسندة:</strong>{projects.filter(p=>p.doctorId===d.id).map(p=><span key={p.id}>{p.title} — {p.status}</span>)}{!projects.some(p=>p.doctorId===d.id)&&<span className="muted">لا توجد مشاريع مسندة.</span>}</div></article>)}</div>
    </section>}

    {tab === "settings" && <section className="panel stack-md"><h2>إعدادات النظام</h2><p className="muted">تؤثر الإعدادات على التحقق في نموذج الطالب ولوحة الأدمن.</p><form className="settings-grid" onSubmit={changeSettings}><Field label="الحد الأدنى لأعضاء الفريق *"><input type="number" min="1" value={settingsDraft.minMembers} onChange={e=>setSettingsDraft(c=>({...c,minMembers:Number(e.target.value)}))}/></Field><Field label="الحد الأقصى لأعضاء الفريق *"><input type="number" min={settingsDraft.minMembers} value={settingsDraft.maxMembers} onChange={e=>setSettingsDraft(c=>({...c,maxMembers:Number(e.target.value)}))}/></Field><Field label="الحد الأقصى للفرق لكل دكتور *"><input type="number" min="1" value={settingsDraft.maxTeamsPerDoctor} onChange={e=>setSettingsDraft(c=>({...c,maxTeamsPerDoctor:Number(e.target.value)}))}/></Field><label className="toggle-row"><input type="checkbox" checked={settingsDraft.registrationOpen} onChange={e=>setSettingsDraft(c=>({...c,registrationOpen:e.target.checked}))}/> استقبال تسجيلات جديدة</label><div className="form-footer"><span className="muted">لن يتم حذف البيانات عند تغيير الإعدادات.</span><button className="btn primary" type="submit"><Save size={17}/> حفظ الإعدادات</button></div></form><div className="alert warning">الإعدادات محفوظة محليًا في هذه النسخة التجريبية. قبل الاستخدام الفعلي يجب تطبيق القواعد نفسها داخل قاعدة البيانات.</div></section>}

    {tab === "audit" && <section className="panel"><h2>سجل العمليات</h2><p className="muted">سجل مبسط للتغييرات التي تمت داخل هذه النسخة التجريبية.</p>{audit.length===0?<Empty text="لا توجد عمليات مسجلة بعد."/>:<div className="history-list">{audit.map(a=><div className="history-item" key={a.id}><strong>{a.action} — {a.projectTitle}</strong><span>{a.actor} · {new Date(a.at).toLocaleString("ar-EG")}</span>{a.note&&<p>{a.note}</p>}</div>)}</div>}</section>}
    <div className="reset-row"><span className="muted">إعادة ضبط البيانات التجريبية تمسح المشاريع والدكاترة المضافين محليًا.</span><button className="btn danger-outline" onClick={() => {if(window.confirm("متأكد من حذف كل بيانات النسخة التجريبية وإعادة الإعدادات الافتراضية؟")){resetDemo();setMessage("تمت إعادة ضبط البيانات التجريبية.");}}}><RotateCcw size={16}/> إعادة ضبط البيانات</button></div>
  </div>;
}
function Field({ label, children, className="" }) { return <div className={`field ${className}`}><label>{label}</label>{children}</div>; }
function Stat({ icon, label, value, detail }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }
function Status({ status }) { return <span className={`status-pill ${status==="مقبول"?"accepted":status==="مرفوض"?"rejected":"pending"}`}>{status}</span>; }
function Empty({ text }) { return <div className="empty-state"><FolderKanban size={28}/><p>{text}</p></div>; }