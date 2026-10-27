import { useMemo, useState } from "react";
import { Search, ClipboardCheck, Users, Clock3, CheckCircle2, XCircle, Eye, History, X } from "lucide-react";
import { useProjects } from "../../context/ProjectContext.jsx";

export default function DoctorDashboard() {
  const { projects, doctors, settings, reviewProject } = useProjects();
  const [doctorId, setDoctorId] = useState(doctors.find(d => d.active)?.id || "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("الكل");
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState("");

  const doctor = doctors.find(d => d.id === doctorId);
  const mine = useMemo(() => projects.filter(p => p.doctorId === doctorId), [projects, doctorId]);
  const filtered = mine.filter(p => (filter === "الكل" || p.status === filter) && `${p.title} ${p.members.map(m => m.name + " " + m.studentId).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const pending = mine.filter(p => p.status === "قيد المراجعة").length;

  const decide = decision => {
    if (!selected) return;
    if (decision === "رفض" && !rejectReason.trim()) { setMessage("اكتب سبب الرفض قبل تسجيل القرار."); return; }
    reviewProject(selected.id, decision, rejectReason.trim(), doctor?.name || "الدكتور");
    setMessage(decision === "قبول" ? "تم قبول المشروع وتسجيل القرار." : "تم رفض المشروع وتسجيل سبب الرفض.");
    setSelected(null); setRejectReason("");
  };

  return <div className="stack-lg">
    <section className="hero"><div><span className="eyebrow">لوحة الدكتور</span><h1>المشاريع المسندة إليّ</h1><p>راجع فرقك وقرارات المشاريع المسندة لحسابك.</p></div><div className="hero-icon"><ClipboardCheck size={34}/></div></section>
    <section className="panel doctor-switcher"><div className="field"><label>عرض تجريبي لحساب الدكتور</label><select value={doctorId} onChange={e => { setDoctorId(e.target.value); setSelected(null); }}><option value="">اختر الدكتور</option>{doctors.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><p className="muted">مؤقتًا يمكنك التبديل بين حسابات الدكاترة للاختبار. تسجيل الدخول والصلاحيات الحقيقية ستُنفّذ عند ربط Supabase.</p></section>
    {message && <div className="alert info">{message}<button className="icon-btn" onClick={() => setMessage("")}><X size={16}/></button></div>}
    <section className="stats-grid">
      <Stat icon={<Users/>} label="الفرق المسندة" value={mine.length} detail={`السعة القصوى ${settings.maxTeamsPerDoctor}`}/>
      <Stat icon={<Clock3/>} label="بانتظار المراجعة" value={pending} detail="تحتاج إلى قرار"/>
      <Stat icon={<CheckCircle2/>} label="المشاريع المقبولة" value={mine.filter(p => p.status === "مقبول").length} detail="تمت الموافقة"/>
      <Stat icon={<XCircle/>} label="المشاريع المرفوضة" value={mine.filter(p => p.status === "مرفوض").length} detail="تحتاج إجراء"/>
    </section>
    <section className="panel">
      <div className="section-heading-row"><div><h2>قائمة المشاريع</h2><p className="muted">تظهر هنا المشاريع المسندة للدكتور المختار فقط.</p></div><div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن مشروع أو طالب"/></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>الكل</option><option>قيد المراجعة</option><option>مقبول</option><option>مرفوض</option></select></div></div>
      {!doctorId ? <Empty text="اختر دكتورًا لعرض مشاريعه."/> : filtered.length === 0 ? <Empty text="لا توجد مشاريع مطابقة. يمكن تقديم مشروع من بوابة الطالب."/> : <div className="project-list">
        {filtered.map(p => <article className="project-list-item" key={p.id}>
          <div className="project-main"><div className="project-title-line"><h3>{p.title}</h3><Status status={p.status}/></div><p>{p.summary}</p><div className="meta-line"><span><Users size={15}/> {p.members.length} أعضاء</span><span>القائد: {p.members.find(m => m.leader)?.name || "غير محدد"}</span><span>الرقم: {p.members.find(m => m.leader)?.studentId || "—"}</span></div></div>
          <button className="btn secondary" onClick={() => { setSelected(p); setRejectReason(""); setMessage(""); }}><Eye size={16}/> التفاصيل والمراجعة</button>
        </article>)}
      </div>}
    </section>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow">تفاصيل المشروع</span><h2>{selected.title}</h2></div><button className="icon-btn" onClick={() => setSelected(null)}><X/></button></div>
      <Status status={selected.status}/>
      <div className="detail-grid"><Detail label="النبذة" value={selected.summary}/><Detail label="الأهداف" value={selected.objectives}/><Detail label="بريد التواصل" value={selected.studentEmail}/><Detail label="هاتف التواصل" value={selected.studentPhone}/><Detail label="قائد الفريق" value={`${selected.members.find(m => m.leader)?.name || "—"} (${selected.members.find(m => m.leader)?.studentId || "—"})`}/></div>
      <h3>أعضاء الفريق</h3><div className="table-wrap"><table><thead><tr><th>الاسم</th><th>الرقم الجامعي</th><th>البريد</th><th>الدور</th></tr></thead><tbody>{selected.members.map(m => <tr key={m.studentId}><td>{m.name}</td><td>{m.studentId}</td><td>{m.email}</td><td>{m.leader ? "قائد الفريق" : "عضو"}</td></tr>)}</tbody></table></div>
      {selected.status === "قيد المراجعة" ? <div className="review-box"><label>سبب الرفض (إلزامي عند الرفض)</label><textarea rows="3" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="اكتب سببًا واضحًا للرفض عند اختيار رفض المشروع."/><div className="button-row"><button className="btn danger" onClick={() => decide("رفض")}><XCircle size={17}/> رفض المشروع</button><button className="btn primary" onClick={() => decide("قبول")}><CheckCircle2 size={17}/> قبول المشروع</button></div></div> : <div className="alert info">تم تسجيل قرار: {selected.status}. سجل المراجعات السابق محفوظ.</div>}
      <h3><History size={17} className="inline-icon"/> سجل المراجعات</h3><HistoryList history={selected.history || []}/>
    </section></div>}
  </div>;
}
function Stat({ icon, label, value, detail }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }
function Status({ status }) { return <span className={`status-pill ${status === "مقبول" ? "accepted" : status === "مرفوض" ? "rejected" : "pending"}`}>{status}</span>; }
function Empty({ text }) { return <div className="empty-state"><ClipboardCheck size={28}/><p>{text}</p></div>; }
function Detail({ label, value }) { return <div className="detail-item"><span>{label}</span><p>{value || "—"}</p></div>; }
function HistoryList({ history }) { return <div className="history-list">{history.map(h => <div className="history-item" key={h.id}><strong>{h.action}</strong><span>{h.actor} · {new Date(h.at).toLocaleString("ar-EG")}</span>{h.note && <p>{h.note}</p>}</div>)}</div>; }