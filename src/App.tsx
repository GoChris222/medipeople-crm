
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { AlertCircle, BriefcaseBusiness, ClipboardList, Database, DollarSign, LayoutDashboard, MapPin, PartyPopper, RefreshCw, Search, Stethoscope, UserRound, Users, X } from "lucide-react";

const SUPABASE_URL = "https://qoyokyuzkpfvaakdkmxg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DUHM9n-IlC17dV4TrPRIoA_1AoVM16W";
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const NAV_ITEMS = ["Dashboard", "All Doctors", "Permanent", "OTD Placements", "Locums", "Follow-ups"];

function money(value: unknown) {
  const cleaned = String(value ?? 0).replace(/[^0-9.-]/g, "");
  const numberValue = Number(cleaned);
  return `$${Math.round(Number.isFinite(numberValue) ? numberValue : 0).toLocaleString()}`;
}
function formatDate(value: unknown) {
  if (!value) return "—";
  try {
    const asString = String(value);
    const dateValue = asString.includes("T") ? new Date(asString) : new Date(`${asString}T00:00:00`);
    if (Number.isNaN(dateValue.getTime())) return asString;
    return dateValue.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  } catch { return String(value); }
}
function toNumber(value: unknown) {
  const numberValue = Number(String(value ?? 0).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
}
function makeUid(prefix: string, id: unknown) { return `${prefix}-${id ?? Math.random().toString(36).slice(2)}`; }

function normalisePerm(row: any) {
  return {
    uid: makeUid("perm", row.id), id: row.id, sourceTable: "perm_doctors", category: "Permanent",
    name: row.name || row.doctor || "—", specialty: row.specialty || "—", location: row.location || row.state || "—",
    client: row.client || row.practice || "—", status: row.status || "Active", stage: row.stage || row.status || "New Enquiry",
    due: row.due_date || row.follow_up_date || row.next_follow_up || "", start: row.start_date || "",
    fee: toNumber(row.netfee || row.net_fee || row.fee || 0), nextAction: row.next_action || row.nextAction || "",
    notes: row.notes || "", email: row.email || "", rego: row.rego || row.registration || "", bhid: row.bhid || row.bullhorn_id || ""
  };
}
function normaliseOtd(row: any) {
  return {
    uid: makeUid("otd", row.id), id: row.id, sourceTable: "otd_placements", category: "OTD Placement",
    name: row.name || row.doctor || "—", specialty: row.specialty || "—", location: row.state || row.location || "—",
    client: row.client || row.practice || "—", status: row.status || "Placed", stage: row.stage || row.status || "Placed",
    due: row.invoice_date || row.due_date || row.start_date || "", start: row.start_date || "",
    fee: toNumber(row.netfee || row.net_fee || row.fee || 0),
    nextAction: row.next_action || (row.paid_date ? "Payment received" : row.invoice_date ? "Invoice sent" : "Check placement status"),
    notes: row.notes || "", email: row.email || "", rego: row.rego || "OTD", bhid: row.bhid || row.bullhorn_id || ""
  };
}
function normaliseLocum(row: any) {
  const rate = toNumber(row.rate), durationDays = toNumber(row.duration_days || row.durationDays), commissionPct = toNumber(row.commission_pct || row.commissionPct);
  const dailyRate = row.rate_type === "hourly" ? rate * 8 : rate;
  const commission = dailyRate && durationDays && commissionPct ? dailyRate * durationDays * commissionPct / 100 : 0;
  return {
    uid: makeUid("locum", row.id), id: row.id, sourceTable: "locum_placements", category: "Locum",
    name: row.doctor || row.name || "—", specialty: row.specialty || "—", location: row.facility || row.location || "—",
    client: row.facility || row.client || "—", status: row.status || "pending", stage: row.stage || row.status || "pending",
    due: row.flag ? row.date_available || row.due_date || "" : row.due_date || "", start: row.date_placed || row.start_date || row.date_available || "",
    fee: commission, nextAction: row.next_action || (row.flag ? "Flagged for follow-up" : ""), notes: row.notes || "",
    email: row.email || "", rego: row.rego || "Locum", bhid: row.bhid || row.bullhorn_id || "", rate, durationDays
  };
}
function runHelperTests() {
  if (typeof window === "undefined") return;
  const win = window as any; if (win.__MEDIPEOPLE_CRM_TESTS_RAN__) return;
  win.__MEDIPEOPLE_CRM_TESTS_RAN__ = true;
  console.assert(money("$7,000") === "$7,000", "money should format currency strings");
  console.assert(formatDate("") === "—", "formatDate should handle empty values");
  console.assert(normalisePerm({ id: 1, name: "Dr Test", fee: "7000" }).name === "Dr Test", "normalisePerm should keep doctor name");
  console.assert(normaliseOtd({ id: 2, name: "Dr OTD", invoice_date: "2026-06-01" }).nextAction === "Invoice sent", "normaliseOtd should infer invoice action");
  console.assert(normaliseLocum({ id: 3, doctor: "Dr Locum", rate: 2000, duration_days: 5, commission_pct: 10 }).fee === 1000, "normaliseLocum should calculate commission");
}
function Button({ children, className = "", ...props }: any) { return <button className={`btn ${className}`} {...props}>{children}</button>; }
function Card({ children, className = "" }: any) { return <div className={`card ${className}`}>{children}</div>; }
function CardContent({ children, className = "" }: any) { return <div className={className}>{children}</div>; }
function CardHeader({ children }: any) { return <div className="card-header">{children}</div>; }
function CardTitle({ children }: any) { return <h2 className="card-title">{children}</h2>; }
function getNavIcon(item: string) { if (item === "Dashboard") return LayoutDashboard; if (item === "Locums") return BriefcaseBusiness; if (item === "OTD Placements") return PartyPopper; if (item === "Follow-ups") return ClipboardList; return Users; }

function StatCard({ label, value, helper, icon: Icon }: any) {
  return <Card><CardContent className="stat-card"><div className="stat-top"><div className="stat-label">{label}</div>{Icon ? <Icon className="icon-muted" /> : null}</div><div className="stat-value">{value}</div><div className="stat-helper">{helper}</div></CardContent></Card>;
}
function DoctorCard({ item, onOpen }: any) {
  return (
    <motion.button layout whileHover={{ y: -2 }} onClick={() => onOpen(item)} className="doctor-card">
      <div className="doctor-top">
        <div><div className="doctor-name">{item.name}</div><div className="doctor-meta"><span><Stethoscope className="tiny-icon" />{item.specialty}</span><span><MapPin className="tiny-icon" />{item.location}</span></div></div>
        <span className="pill">{item.category}</span>
      </div>
      <div className="doctor-grid"><div><div className="small-muted">Stage</div><div className="small-strong">{item.stage}</div></div><div><div className="small-muted">Due / Start</div><div className="small-strong">{formatDate(item.due || item.start)}</div></div><div><div className="small-muted">Net / Comm</div><div className="small-strong">{money(item.fee)}</div></div></div>
    </motion.button>
  );
}
function DetailModal({ item, onClose }: any) {
  if (!item) return null;
  return (
    <div className="modal-backdrop">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="modal">
        <div className="modal-top"><div><h2>{item.name}</h2><p>{item.category} • {item.sourceTable}</p></div><Button onClick={onClose} className="ghost-btn"><X /></Button></div>
        <div className="detail-grid">
          <div><b>Status / Stage:</b> {item.status} / {item.stage}</div><div><b>Client:</b> {item.client}</div><div><b>Registration / Type:</b> {item.rego || "—"}</div>
          <div><b>Due:</b> {formatDate(item.due)} &nbsp; <b>Start:</b> {formatDate(item.start)}</div><div><b>Fee / Commission:</b> {money(item.fee)}</div><div><b>Next action:</b> {item.nextAction || "—"}</div>
          <div className="notes"><b>Notes:</b><br />{item.notes || "—"}</div>{item.email ? <div><b>Email:</b> {item.email}</div> : null}{item.bhid ? <div><b>Bullhorn ID:</b> {item.bhid}</div> : null}
        </div>
      </motion.div>
    </div>
  );
}
function Sidebar({ active, setActive, followupCount }: any) {
  return <aside className="sidebar"><div className="brand"><div className="brand-title">🏥 MediPeople</div><div className="brand-subtitle">Unified CRM</div></div><nav className="nav">{NAV_ITEMS.map((item) => { const Icon = getNavIcon(item); const selected = active === item; return <button key={item} onClick={() => setActive(item)} className={`nav-btn ${selected ? "active" : ""}`}><Icon />{item}{item === "Follow-ups" ? <span className="badge">{followupCount}</span> : null}</button>; })}</nav><div className="db-card"><div><Database />Connected to Supabase</div><p>Reads: perm_doctors, otd_placements, locum_placements</p></div></aside>;
}
function Header({ query, setQuery, onRefresh, loading }: any) {
  return <header className="header"><div className="mobile-brand"><div className="brand-title">🏥 MediPeople</div><div className="brand-subtitle">Unified CRM</div></div><div className="header-actions"><div className="search-wrap"><Search className="search-icon" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search doctor, client, specialty..." /></div><Button onClick={onRefresh} disabled={loading} className="primary-btn"><RefreshCw className={loading ? "spin" : ""} />Refresh</Button></div></header>;
}
function DashboardView({ stats, loading, records, onOpen }: any) {
  return <div className="space"><h1>Dashboard</h1><div className="stats-grid"><StatCard label="All Records" value={loading ? "..." : stats.total} helper="Across 3 dashboards" icon={Users} /><StatCard label="Permanent" value={stats.perm} helper="perm_doctors" icon={UserRound} /><StatCard label="OTD" value={stats.otd} helper="otd_placements" icon={PartyPopper} /><StatCard label="Locums" value={stats.locum} helper="locum_placements" icon={BriefcaseBusiness} /><StatCard label="Pipeline" value={money(stats.revenue)} helper="Net / commission estimate" icon={DollarSign} /></div><Card><CardHeader><CardTitle>Recent CRM Records</CardTitle></CardHeader><CardContent className="records-list">{loading ? <div className="empty">Loading Supabase data...</div> : records.length ? records.slice(0, 8).map((record: any) => <DoctorCard key={record.uid} item={record} onOpen={onOpen} />) : <div className="empty">No records found.</div>}</CardContent></Card></div>;
}
function ListView({ title, loading, records, onOpen }: any) {
  return <div className="space"><div className="list-title"><h1>{title}</h1><div>{records.length} records</div></div><div className="records-list">{loading ? <Card className="empty">Loading...</Card> : records.length ? records.map((record: any) => <DoctorCard key={record.uid} item={record} onOpen={onOpen} />) : <Card className="empty">No records found.</Card>}</div></div>;
}
export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any>(null);

  async function loadAll() {
    setLoading(true); setError("");
    try {
      const [perm, otd, locum] = await Promise.all([
        db.from("perm_doctors").select("*").order("id", { ascending: true }),
        db.from("otd_placements").select("*").order("id", { ascending: true }),
        db.from("locum_placements").select("*").order("date_available", { ascending: true })
      ]);
      const firstError = [perm.error, otd.error, locum.error].find(Boolean);
      if (firstError) throw firstError;
      setRecords([...(perm.data || []).map(normalisePerm), ...(otd.data || []).map(normaliseOtd), ...(locum.data || []).map(normaliseLocum)]);
    } catch (caughtError: any) {
      setError(caughtError?.message || "Could not load Supabase data.");
    } finally { setLoading(false); }
  }
  useEffect(() => { runHelperTests(); loadAll(); }, []);

  const filteredRecords = useMemo(() => {
    let rows = records;
    if (active === "Permanent") rows = rows.filter((record) => record.category === "Permanent");
    if (active === "OTD Placements") rows = rows.filter((record) => record.category === "OTD Placement");
    if (active === "Locums") rows = rows.filter((record) => record.category === "Locum");
    if (active === "Follow-ups") rows = rows.filter((record) => record.due || record.nextAction);
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return rows;
    return rows.filter((record) => [record.name, record.specialty, record.location, record.client, record.status, record.stage, record.notes, record.nextAction, record.rego, record.bhid].join(" ").toLowerCase().includes(cleanQuery));
  }, [records, active, query]);

  const stats = useMemo(() => ({
    total: records.length,
    perm: records.filter((record) => record.category === "Permanent").length,
    otd: records.filter((record) => record.category === "OTD Placement").length,
    locum: records.filter((record) => record.category === "Locum").length,
    revenue: records.reduce((sum, record) => sum + toNumber(record.fee), 0),
    followups: records.filter((record) => record.due || record.nextAction).length
  }), [records]);

  return <div className="app"><Sidebar active={active} setActive={setActive} followupCount={stats.followups} /><main className="main"><Header query={query} setQuery={setQuery} onRefresh={loadAll} loading={loading} /><section className="content">{error ? <Card className="error-card"><CardContent><AlertCircle />{error}</CardContent></Card> : null}{active === "Dashboard" ? <DashboardView stats={stats} loading={loading} records={filteredRecords} onOpen={setSelected} /> : <ListView title={active === "All Doctors" ? "All Doctors" : active} loading={loading} records={filteredRecords} onOpen={setSelected} />}</section></main><DetailModal item={selected} onClose={() => setSelected(null)} /></div>;
}
