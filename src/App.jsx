import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, ClipboardList, Target, LayoutDashboard, Bell, Search, Plus, Filter, ChevronRight, AlertCircle, Clock, Edit2, Trash2, X, Save, ArrowUpRight, Layers, GraduationCap, Award, AlertTriangle, Zap, Upload, FileText, CheckCircle2, Phone, Mail, AtSign } from 'lucide-react';
import ConnectionView from './ConnectionView';
import RecruitingBoard from './RecruitingBoard';
import CampList from './CampList';
import { supabase, acl } from './supabaseClient';
import Login from './Login';
// ============================================================
// FORGED IN STEEL · Pitt Women's Soccer · Front Office OS
// Ben Waldrum — Head Coach
// ============================================================

const PITT_NAVY = '#003594';
const PITT_GOLD = '#FFB81C';

// ============================================================
// REAL STAFF DATA
// ============================================================
const DEFAULT_STAFF = [
  { id: 's1', name: 'Ben Waldrum',      role: 'Head Coach',                      initials: 'BW', color: 'bg-amber-500' },
  { id: 's2', name: 'Randy Waldrum',    role: 'Technical Director',              initials: 'RW', color: 'bg-blue-600' },
  { id: 's3', name: 'Brianna Alleyne',  role: 'Assistant Coach',                 initials: 'BA', color: 'bg-emerald-500' },
  { id: 's4', name: 'TBD',             role: 'Asst Coach / GK Coach',           initials: 'GK', color: 'bg-violet-500' },
  { id: 's5', name: 'Ann Marie Porada', role: 'Athletic Trainer',                initials: 'AP', color: 'bg-rose-500' },
  { id: 's6', name: 'Brenna McDonald',  role: 'Strength & Conditioning',         initials: 'BM', color: 'bg-teal-500' },
  { id: 's7', name: 'TBD',             role: 'Sport Science Intern',             initials: 'SS', color: 'bg-orange-400' },
  { id: 's8', name: 'Rachel Bilenki',   role: 'Sports Information Director',     initials: 'RB', color: 'bg-pink-500' },
  { id: 's9', name: 'Trevor Fontan',    role: 'Marketing',                       initials: 'TF', color: 'bg-cyan-500' },
];

// ============================================================
// REAL FORMATION — 4-3-3 (CAM variant)
// Positions match your depth chart JSON exactly
// ============================================================
const FORMATION_433 = [
  { id: 'lw',  label: 'LW',  x: 16, y: 16, role: 'F'   },
  { id: 'st',  label: 'ST',  x: 50, y: 10, role: 'F'   },
  { id: 'rw',  label: 'RW',  x: 84, y: 16, role: 'F'   },
  { id: 'cm',  label: 'CM',  x: 26, y: 42, role: 'M'   },
  { id: 'cdm', label: 'CDM', x: 50, y: 52, role: 'M'   },
  { id: 'cam', label: 'CAM', x: 74, y: 42, role: 'M'   },
  { id: 'lb',  label: 'LB',  x: 14, y: 68, role: 'D'   },
  { id: 'cb1', label: 'CB',  x: 36, y: 74, role: 'D'   },
  { id: 'cb2', label: 'CB',  x: 64, y: 74, role: 'D'   },
  { id: 'rb',  label: 'RB',  x: 86, y: 68, role: 'D'   },
  { id: 'gk',  label: 'GK',  x: 50, y: 90, role: 'GK'  },
];

const emptyDepthYear = () => {
  const out = {};
  FORMATION_433.forEach(p => { out[p.id] = { starter: '', second: '', third: '', readiness: 'dev' }; });
  return out;
};

// ============================================================
// REAL 2026 DEPTH CHART — from your JSON
// status mapping: starter → starter_ready, sig → significant_mins, dev → developmental
// ============================================================
const DEFAULT_DEPTH_CHART = {
  2026: {
    rosterNotes: 'Recruiting 2-3 Goalkeepers on the Transfer Portal',
    gk:  { starter: 'Elli Johnson',         second: 'Addison Roemer',     third: '',               readiness: 'significant_mins' },
    rb:  { starter: 'Mya Archibald',         second: 'Eden Jones',         third: 'Elle Jaramillo',  readiness: 'starter_ready' },
    cb1: { starter: 'Katie Zailski',         second: 'Sophie Rourke',      third: '',               readiness: 'starter_ready' },
    cb2: { starter: 'Olivia Lee',            second: 'Eden Jones',         third: '',               readiness: 'starter_ready' },
    lb:  { starter: 'Claire Jones',          second: 'Olivia Lee',         third: 'Sage Stelzer',   readiness: 'starter_ready' },
    cdm: { starter: 'Mariama Dabo',          second: 'Ellie Rowlands',     third: 'Savannah Johnson', readiness: 'starter_ready' },
    cm:  { starter: 'Katie Ellermeyer',      second: 'Laila Vloet',        third: 'Yina Adoo',      readiness: 'starter_ready' },
    cam: { starter: 'Celina Ottah',          second: 'Weslee Istone-Haupt',third: 'Maci Tew',       readiness: 'starter_ready' },
    rw:  { starter: 'Sage Stelzer',          second: 'Taylin Guthrie',     third: 'Desiree Reed',   readiness: 'starter_ready' },
    st:  { starter: 'Sophia Doheny',         second: 'Desiree Reed',       third: 'Adi Bianchin',   readiness: 'starter_ready' },
    lw:  { starter: 'Lola Abraham',          second: 'Blakely Soderman',   third: '',               readiness: 'starter_ready' },
  },
  2027: { rosterNotes: '', ...emptyDepthYear() },
  2028: { rosterNotes: '', ...emptyDepthYear() },
  2029: { rosterNotes: '', ...emptyDepthYear() },
};

// ============================================================
// REAL SCHOLARSHIP DATA — from CSVs
// ============================================================
const DEFAULT_SCHOLARSHIPS = {
  '2026-27': [
    { id: 'a1',  name: 'Abraham, Lola',        year: 'Jr',    dsa: false, school: 'ENGR', eq: 0.45, dollars: 21000,  period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a2',  name: 'Archibald, Mya',       year: 'Sr',    dsa: false, school: 'CAS',  eq: 0.41, dollars: 27051,  period: 'Semester', notes: 'Semester only',                                                             confirmed: true  },
    { id: 'a3',  name: 'Bianchin, Adi',        year: 'So',    dsa: false, school: 'CAS',  eq: 0.68, dollars: 45000,  period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a4',  name: 'Bruce, Maya',          year: 'So',    dsa: true,  school: '',     eq: 0,    dollars: 0,      period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a5',  name: 'Dabo, Mariama',        year: 'Sr',    dsa: false, school: 'CAS',  eq: 0.41, dollars: 27051,  period: 'Semester', notes: 'May need spring',                                                           confirmed: false },
    { id: 'a6',  name: 'Doheny, Sofia',        year: 'Sr',    dsa: false, school: 'CBA',  eq: 0.64, dollars: 45500,  period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a7',  name: 'Ellermeyer, Katie',    year: 'So',    dsa: false, school: 'CBA',  eq: 0.48, dollars: 35000,  period: 'Year',     notes: '$35,000 ÷ $73,088 CBA OOS COA = 0.48',                                     confirmed: true  },
    { id: 'a8',  name: 'Guthrie, Talyn',       year: 'Fr',    dsa: false, school: '',     eq: 1.00, dollars: 0,      period: 'Year',     notes: 'Including COA – form on file',                                              confirmed: true  },
    { id: 'a9',  name: 'Istone-Haupt, Weslee', year: 'Fr',    dsa: false, school: '',     eq: 0.65, dollars: 42000,  period: 'Year',     notes: 'Form on file',                                                              confirmed: true  },
    { id: 'a10', name: 'Johnson, Elli',        year: 'Fr',    dsa: false, school: '',     eq: 0.70, dollars: 45000,  period: 'Year',     notes: '5k rev share spring; form on file',                                         confirmed: true  },
    { id: 'a11', name: 'Johnson, Savannah',    year: 'Fr',    dsa: false, school: '',     eq: 0.20, dollars: 13000,  period: 'Year',     notes: '5k rev share summer; form on file',                                         confirmed: true  },
    { id: 'a12', name: 'Jones, Claire',        year: 'Sr',    dsa: false, school: '',     eq: 0.50, dollars: 0,      period: 'Year',     notes: '5k rev share spring; form on file',                                         confirmed: true  },
    { id: 'a13', name: 'Jones, Eden',          year: 'Fr',    dsa: false, school: '',     eq: 0.89, dollars: 59000,  period: 'Year',     notes: 'Form on file',                                                              confirmed: true  },
    { id: 'a14', name: 'Lee, Olivia',          year: 'Sr',    dsa: false, school: 'CBA',  eq: 0.45, dollars: 31980,  period: 'Year',     notes: 'Graduating at semester (.23)',                                              confirmed: true  },
    { id: 'a15', name: 'Minogue, Hannah',      year: 'So',    dsa: false, school: 'CAS',  eq: 0.17, dollars: 11000,  period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a16', name: 'Rourke, Sophie',       year: 'So',    dsa: true,  school: 'CBA',  eq: 0.14, dollars: 10000,  period: 'Year',     notes: '$10,000 ÷ $73,088 CBA OOS COA = 0.14',                                     confirmed: true  },
    { id: 'a17', name: 'Rowlands, Ellie',      year: 'So',    dsa: false, school: '',     eq: 0,    dollars: 0,      period: 'Year',     notes: 'Wants money; increased past spring',                                        confirmed: false },
    { id: 'a18', name: 'Roemer, Addison',      year: 'Jr',    dsa: false, school: '',     eq: 0,    dollars: 0,      period: 'Year',     notes: 'Form on file',                                                              confirmed: true  },
    { id: 'a19', name: 'Soderman, Blakely',    year: 'Fr',    dsa: false, school: 'CAS',  eq: 0.74, dollars: 50000,  period: 'Year',     notes: 'Form on file',                                                              confirmed: true  },
    { id: 'a20', name: 'Stelzer, Sage',        year: 'Sr',    dsa: true,  school: '',     eq: 0,    dollars: 0,      period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a21', name: 'Tew, Maci',            year: 'Fr',    dsa: false, school: 'CAS',  eq: 0.89, dollars: 59000,  period: 'Year',     notes: 'Form on file',                                                              confirmed: true  },
    { id: 'a22', name: 'Vloet, Laila',         year: 'Fr',    dsa: false, school: '',     eq: 0.89, dollars: 59000,  period: 'Year',     notes: 'Form on file',                                                              confirmed: true  },
    { id: 'a23', name: 'Wells, Lucia',         year: 'Sr',    dsa: false, school: '',     eq: 0.26, dollars: 0,      period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a24', name: 'Zailski, Katie',       year: 'GRAD',  dsa: false, school: 'CAS',  eq: 0.50, dollars: 32897,  period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a25', name: 'Jaramillo, Elle',      year: 'Fr',    dsa: false, school: '',     eq: 0,    dollars: 0,      period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a26', name: 'Ottah, Celine',        year: 'RS/Sr', dsa: false, school: '',     eq: 0.50, dollars: 0,      period: 'Year',     notes: '',                                                                          confirmed: true  },
    { id: 'a27', name: 'Yina, Philomina',      year: 'So',    dsa: false, school: 'CAS',  eq: 0.45, dollars: 24287,  period: 'Semester', notes: 'Semester only — OOS CAS: $48,574 ÷ 2 = $24,287',                           confirmed: true  },
    { id: 'a28', name: 'Reed, Desiree',        year: 'Fr',    dsa: false, school: '',     eq: 0.89, dollars: 59000,  period: 'Year',     notes: 'Form on file',                                                              confirmed: true  },
  ],
  '2027-28': [
    { id: 'b1',  name: 'Abraham, Lola',        year: 'Sr',  dsa: false, school: 'ENGR', eq: 0.69, dollars: 32500, period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b2',  name: 'Bianchin, Adi',        year: 'Jr',  dsa: false, school: 'CAS',  eq: 0.76, dollars: 50000, period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b3',  name: 'Bruce, Maya',          year: 'Jr',  dsa: true,  school: '',     eq: 0,    dollars: 0,     period: 'Year', notes: '',                                                                              confirmed: false },
    { id: 'b4',  name: 'Ellermeyer, Katie',    year: 'Jr',  dsa: false, school: 'CBA',  eq: 0.60, dollars: 42500, period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b5',  name: 'Guthrie, Talyn',       year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b6',  name: 'Istone-Haupt, Weslee', year: 'So',  dsa: false, school: '',     eq: 0.65, dollars: 0,     period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b7',  name: 'Johnson, Elli',        year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b8',  name: 'Johnson, Savannah',    year: 'So',  dsa: false, school: '',     eq: 0.40, dollars: 0,     period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b9',  name: 'Jones, Eden',          year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b10', name: 'Minogue, Hannah',      year: 'So',  dsa: false, school: 'CAS',  eq: 0.65, dollars: 42500, period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b11', name: 'Rourke, Sophie',       year: 'Jr',  dsa: true,  school: 'CBA',  eq: 0.49, dollars: 35000, period: 'Year', notes: 'Could be CAS considering',                                                     confirmed: false },
    { id: 'b12', name: 'Rowlands, Ellie',      year: 'Jr',  dsa: false, school: '',     eq: 0,    dollars: 0,     period: 'Year', notes: 'Listed — could use rev sharing',                                               confirmed: false },
    { id: 'b13', name: 'Tew, Maci',            year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                                                                     confirmed: false },
    { id: 'b14', name: 'Hennessy, Ailish',     year: 'Fr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected incoming',                                                            confirmed: false },
    { id: 'b15', name: 'Reed, Desiree',        year: 'Fr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected incoming',                                                            confirmed: false },
    { id: 'b16', name: 'Khera, Mehr',          year: 'Fr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected incoming',                                                            confirmed: false },
    { id: 'b17', name: 'Abellana, Angellinne', year: 'Fr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected incoming',                                                            confirmed: false },
    { id: 'b18', name: 'McKee, Emily',         year: 'Fr',  dsa: false, school: 'CAS',  eq: 0.33, dollars: 15000, period: 'Year', notes: '$15,000 ÷ $45,098 CAS PA resident COA = 0.33',                                  confirmed: false },
    { id: 'b19', name: 'Tornabene, Ana',       year: 'Fr',  dsa: false, school: 'CAS',  eq: 0.38, dollars: 25000, period: 'Year', notes: '$25,000 ÷ $65,794 CAS OOS COA = 0.38',                                          confirmed: false },
    { id: 'b20', name: 'Tovar, Samantha',      year: 'Fr',  dsa: false, school: 'CAS',  eq: 0.46, dollars: 30000, period: 'Year', notes: '$30,000 ÷ $65,794 OOS CAS COA = 0.46',                                          confirmed: false },
    { id: 'b21', name: 'Soderman, Blakely',    year: 'So',  dsa: false, school: 'CAS',  eq: 0,    dollars: 50000, period: 'Year', notes: 'One-year agreement only — eq not carried forward; dollars held pending renewal', confirmed: false },
  ],
  '2028-29': [
    { id: 'c1',  name: 'Bianchin, Adi',        year: 'Sr',  dsa: false, school: 'CAS',  eq: 0.76, dollars: 50000, period: 'Year', notes: 'Projected — Sr year',                confirmed: false },
    { id: 'c2',  name: 'Bruce, Maya',          year: 'Sr',  dsa: true,  school: '',     eq: 0,    dollars: 0,     period: 'Year', notes: 'Sr year',                            confirmed: false },
    { id: 'c3',  name: 'Ellermeyer, Katie',    year: 'Sr',  dsa: false, school: 'CBA',  eq: 0.60, dollars: 42500, period: 'Year', notes: 'Projected — Sr year',                confirmed: false },
    { id: 'c4',  name: 'Guthrie, Talyn',       year: 'Jr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c5',  name: 'Istone-Haupt, Weslee', year: 'Jr',  dsa: false, school: '',     eq: 0.65, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c6',  name: 'Johnson, Elli',        year: 'Jr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c7',  name: 'Johnson, Savannah',    year: 'Jr',  dsa: false, school: '',     eq: 0.40, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c8',  name: 'Jones, Eden',          year: 'Jr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c9',  name: 'Minogue, Hannah',      year: 'Jr',  dsa: false, school: 'CAS',  eq: 0.65, dollars: 42500, period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c10', name: 'Rourke, Sophie',       year: 'Sr',  dsa: true,  school: 'CBA',  eq: 0.49, dollars: 35000, period: 'Year', notes: 'Projected — Sr year; could be CAS', confirmed: false },
    { id: 'c11', name: 'Rowlands, Ellie',      year: 'Sr',  dsa: false, school: '',     eq: 0,    dollars: 0,     period: 'Year', notes: 'Sr year — could use rev sharing',    confirmed: false },
    { id: 'c12', name: 'Tew, Maci',            year: 'Jr',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c13', name: 'Hennessy, Ailish',     year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c14', name: 'Reed, Desiree',        year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c15', name: 'Khera, Mehr',          year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c16', name: 'Abellana, Angellinne', year: 'So',  dsa: false, school: '',     eq: 0.89, dollars: 0,     period: 'Year', notes: 'Projected',                          confirmed: false },
    { id: 'c17', name: 'McKee, Emily',         year: 'So',  dsa: false, school: 'CAS',  eq: 0.33, dollars: 15000, period: 'Year', notes: '$15,000 ÷ $45,098 CAS PA resident',  confirmed: false },
    { id: 'c18', name: 'Tornabene, Ana',       year: 'So',  dsa: false, school: 'CAS',  eq: 0.38, dollars: 25000, period: 'Year', notes: '$25,000 ÷ $65,794 CAS OOS COA',      confirmed: false },
    { id: 'c19', name: 'Tovar, Samantha',      year: 'So',  dsa: false, school: 'CAS',  eq: 0.46, dollars: 30000, period: 'Year', notes: '$30,000 ÷ $65,794 OOS CAS COA',      confirmed: false },
    { id: 'c20', name: 'Soderman, Blakely',    year: 'Jr',  dsa: false, school: 'CAS',  eq: 0,    dollars: 50000, period: 'Year', notes: 'One-year agreement only — pending renewal', confirmed: false },
  ],
  '2025-26': [],
};

// ============================================================
// REAL 2028 RECRUITS — Tier 1 and Tier 1/2 (36 prospects)
// ============================================================
const DEFAULT_RECRUITS = [
  { id: 'r1',  name: 'Mary Mac Brown',      pos: 'MF/F', club: 'Atlanta Fire 09',   league: 'ECNL', tier: '1',   phone: '678-215-4885', handle: '',                 email: 'marymacbrown2@icloud.com',       notes: '', class: '2028', stage: 'identified' },
  { id: 'r2',  name: 'Tatum Gardner',       pos: 'F',    club: 'AZ Arsenal 09',     league: 'ECNL', tier: '1',   phone: '480-601-2822', handle: 'tatum_gardner10',   email: 'tatumgardner2028@gmail.com',     notes: '', class: '2028', stage: 'identified' },
  { id: 'r3',  name: 'Dakota Bacelli',      pos: 'F',    club: 'Beach FC (CA) 10',  league: 'ECNL', tier: '1',   phone: '',             handle: 'dakotabaccelli',    email: 'dakotabaccelli@gmail.com',       notes: '', class: '2028', stage: 'identified' },
  { id: 'r4',  name: 'Kaylin Hoffman',      pos: 'GK',   club: 'Beadling 10',       league: 'GA',   tier: '1',   phone: '',             handle: '',                 email: 'kghoffman005@gmail.com',         notes: '', class: '2028', stage: 'identified' },
  { id: 'r5',  name: 'Amiyah Curry',        pos: 'F',    club: 'Bethesda SC 10',    league: 'ECNL', tier: '1',   phone: '907-602-4354', handle: '',                 email: 'wonderfulsoccera@gmail.com',     notes: '', class: '2028', stage: 'identified' },
  { id: 'r6',  name: 'Brielle Hopkins',     pos: 'CB',   club: 'CSA 10',            league: 'ECNL', tier: '1',   phone: '',             handle: 'brielle_hophop',   email: 'briellegoo@icloud.com',          notes: 'Most athletic, cerebral player on team. Plays with u-19s', class: '2028', stage: 'identified' },
  { id: 'r7',  name: 'Lola-Iris Ta',        pos: 'GK',   club: 'FC Dallas 09',      league: 'ECNL', tier: '2/1', phone: '972-965-6063', handle: '',                 email: 'lolairista@gmail.com',           notes: '', class: '2028', stage: 'identified' },
  { id: 'r8',  name: 'Taylor Ladd',         pos: 'MF',   club: 'FC Dallas 10',      league: 'ECNL', tier: '1',   phone: '469-888-1320', handle: '',                 email: 'taylorgladd@gmail.com',          notes: '', class: '2028', stage: 'identified' },
  { id: 'r9',  name: 'Lila Helwig',         pos: 'F',    club: 'FC Delco 09',       league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: 'lilahhelwig28@gmail.com',        notes: 'Gotham ID', class: '2028', stage: 'identified' },
  { id: 'r10', name: 'Gabby Gledjun',       pos: 'GK',   club: 'Galaxy 10',         league: 'GA',   tier: '1',   phone: '',             handle: '',                 email: 'gjeldumgabby@gmail.com',         notes: '', class: '2028', stage: 'identified' },
  { id: 'r11', name: 'Hope Ernst',          pos: 'F',    club: 'Matchfit 09',       league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r12', name: 'Kennedy Wallace',     pos: 'MF',   club: 'Matchfit 09',       league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r13', name: 'Flo Ibsen',           pos: 'MF',   club: 'MVLA 10',           league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r14', name: 'Cassandra Travers',   pos: 'F',    club: 'MVLA 10',           league: 'ECNL', tier: '2/1', phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r15', name: 'Georgianna Zuniga',   pos: 'OB/CM',club: 'MVLA 10',           league: 'ECNL', tier: '2/1', phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r16', name: 'Karolina Bodyziak',   pos: 'F',    club: 'PDA 09',            league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r17', name: 'Carly Barnes',        pos: 'MF',   club: 'Penn Fusion 10',    league: 'ECNL', tier: '2/1', phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r18', name: 'Anaya Bursey',        pos: 'F',    club: 'Real Colorado 10',  league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r19', name: 'Julia Dern',          pos: 'F',    club: 'Real Colorado 10',  league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r20', name: 'Madison Davis',       pos: 'F',    club: 'Richmond United 09',league: 'ECNL', tier: '1/2', phone: '865-500-9027', handle: '',                 email: 'madisondavis2028@gmail.com',     notes: '', class: '2028', stage: 'identified' },
  { id: 'r21', name: 'Anna Korney',         pos: 'F',    club: 'Riverhounds 09',    league: 'ECNL', tier: '2/1', phone: '',             handle: '',                 email: 'annak94soccer@gmail.com',        notes: '', class: '2028', stage: 'identified' },
  { id: 'r22', name: 'Kayleigh Cabignon',   pos: 'F',    club: 'SD Surf 10',        league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r23', name: 'Zoey Nelson',         pos: 'MF',   club: 'SD Surf 10',        league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r24', name: 'Georgia Restovich',   pos: 'MF',   club: 'SLSG Navy 09',      league: 'ECNL', tier: '1',   phone: '314-960-2184', handle: '',                 email: 'georgiarestovich@gmail.com',     notes: '', class: '2028', stage: 'identified' },
  { id: 'r25', name: 'Noelle Granger',      pos: '',     club: 'SLSG Navy 10',      league: 'ECNL', tier: '1/2', phone: '314-307-6386', handle: '',                 email: 'noellegranger09@gmail.com',      notes: '', class: '2028', stage: 'identified' },
  { id: 'r26', name: 'Favour Macaulay',     pos: 'F',    club: 'So Cal Blues 10',   league: 'ECNL', tier: '1',   phone: '714-568-8135', handle: 'favour.macaulay_', email: 'favvmacaulay@gmail.com',         notes: '', class: '2028', stage: 'identified' },
  { id: 'r27', name: 'Addison Staats',      pos: 'F',    club: 'Solar 10',          league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: 'addisonstaats@icloud.com',       notes: '', class: '2028', stage: 'identified' },
  { id: 'r28', name: 'Ryan Frantangelo',    pos: 'LB',   club: 'Solar 10',          league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: 'ryan.frantangelo10@gmail.com',   notes: '', class: '2028', stage: 'identified' },
  { id: 'r29', name: 'Jazlynn Roman Castro',pos: 'CB',   club: 'Sporting Iowa 10',  league: 'ECNL', tier: '2/1', phone: '',             handle: '',                 email: 'jazlynnrc@icloud.com',           notes: '', class: '2028', stage: 'identified' },
  { id: 'r30', name: 'Kyleigh Pete',        pos: '',     club: 'Sting Royal 09',    league: 'ECNL', tier: '1',   phone: '',             handle: '',                 email: 'kyleigh.pete@gmail.com',         notes: '', class: '2028', stage: 'identified' },
  { id: 'r31', name: 'Emily Baxter',        pos: 'MF',   club: 'Tophat 09',         league: 'GA',   tier: '1',   phone: '',             handle: '',                 email: 'emilybaxtersoccer25@gmail.com',  notes: '', class: '2028', stage: 'identified' },
  { id: 'r32', name: 'Olivia Grace Akatue', pos: 'F',    club: 'TSC 09',            league: 'ECNL', tier: '2/1', phone: '',             handle: '',                 email: 'ogakatue@gmail.com',             notes: '', class: '2028', stage: 'identified' },
  { id: 'r33', name: 'Natalie Duffie',      pos: 'F',    club: 'Ukranians 10',      league: 'ECNL', tier: '2/1', phone: '',             handle: '',                 email: 'natnat23duffie@gmail.com',       notes: '', class: '2028', stage: 'identified' },
  { id: 'r34', name: 'Claire Badger',       pos: 'MF',   club: 'Utah Celtic 09',    league: 'GA',   tier: '1',   phone: '',             handle: '',                 email: '',                               notes: '', class: '2028', stage: 'identified' },
  { id: 'r35', name: 'Avellina Saunders',   pos: 'GK',   club: 'Utah Royals AZ',    league: 'ECNL', tier: '1',   phone: '480-417-1019', handle: '',                 email: 'shanelsaunders@gmail.com',       notes: '', class: '2028', stage: 'identified' },
  { id: 'r36', name: 'Kyah Smith',          pos: 'F',    club: 'VDA 09',            league: 'ECNL', tier: '2/1', phone: '571-469-7893', handle: '',                 email: 'kyahsue03@icloud.com',           notes: '', class: '2028', stage: 'identified' },
];

const DEFAULT_TASKS = [];
const DEFAULT_EVENTS = [];
const DEFAULT_PLAYERS = [];

const RECRUIT_STAGES = ['identified', 'evaluating', 'offer_extended', 'visit_scheduled', 'committed'];
const RECRUIT_STAGE_LABELS = { identified: 'Identified', evaluating: 'Evaluating', offer_extended: 'Offer Extended', visit_scheduled: 'Visit Scheduled', committed: 'Committed' };

const STATUS_META = { todo: { label: 'To Do', dot: 'bg-stone-400' }, in_progress: { label: 'In Progress', dot: 'bg-amber-500' }, review: { label: 'Review', dot: 'bg-blue-500' }, done: { label: 'Done', dot: 'bg-emerald-600' } };
const PRIORITY_META = { high: { label: 'High', cls: 'text-red-700 bg-red-50 border-red-200' }, medium: { label: 'Med', cls: 'text-amber-700 bg-amber-50 border-amber-200' }, low: { label: 'Low', cls: 'text-stone-600 bg-stone-50 border-stone-200' } };
const EVENT_TYPE_META = { training: { color: 'bg-emerald-600', label: 'Training', hex: '#059669' }, match: { color: 'bg-amber-600', label: 'Match', hex: '#d97706' }, travel: { color: 'bg-sky-600', label: 'Travel', hex: '#0284c7' }, meeting: { color: 'bg-stone-700', label: 'Meeting', hex: '#44403c' }, recruiting: { color: 'bg-violet-600', label: 'Recruiting', hex: '#7c3aed' }, academic: { color: 'bg-pink-600', label: 'Academic', hex: '#db2777' } };
const READINESS_META = { starter_ready: { label: 'Starter', color: 'bg-emerald-500', hex: '#10b981' }, significant_mins: { label: 'Sig. Mins', color: 'bg-amber-500', hex: '#f59e0b' }, developmental: { label: 'Developmental', color: 'bg-stone-500', hex: '#78716c' }, recruit_needed: { label: 'Recruit Needed', color: 'bg-red-500', hex: '#ef4444' } };
const STAFF_COLORS = ['bg-amber-500','bg-blue-600','bg-emerald-500','bg-rose-500','bg-violet-500','bg-orange-400','bg-teal-500','bg-pink-500','bg-cyan-500','bg-indigo-500'];

const formatDate = d => { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const daysUntil = d => { const t = new Date('2026-05-09'); const dt = new Date(d + 'T00:00:00'); return Math.round((dt - t) / 86400000); };
const newId = p => `${p}${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const initialsFrom = n => (n || '').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '??';
const fmtMoney = n => '$' + Math.round(n || 0).toLocaleString();
const fmtEq = n => ((n || 0)).toFixed(2);

async function loadStore(key, fallback) {
  try {
    const { data } = await supabase.from('app_data').select('value').eq('key', key).maybeSingle();
    if (data && data.value != null) return data.value;
    if (acl.role && acl.role !== 'viewer') await supabase.from('app_data').upsert({ key, value: fallback });
  } catch {}
  return fallback;
}
async function saveStore(key, val) {
  if (!acl.role || acl.role === 'viewer') return;
  try { await supabase.from('app_data').upsert({ key, value: val, updated_at: new Date().toISOString() }); } catch {}
}

// ============================================================
// PRIMITIVES
// ============================================================
const Avatar = ({ staff, size = 'md' }) => {
  if (!staff) return null;
  const sz = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-11 w-11 text-sm' }[size];
  return <div className={`${sz} ${staff.color} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white/20 shrink-0`} title={`${staff.name} — ${staff.role}`}>{staff.initials}</div>;
};

const Modal = ({ open, onClose, title, children, footer, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-stone-900 border border-stone-700 ${wide ? 'max-w-4xl' : 'max-w-lg'} w-full max-h-[90vh] flex flex-col shadow-2xl rounded-sm`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
          <h3 className="font-serif text-xl text-stone-100" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{title}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 p-1 rounded"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1 text-stone-200">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-stone-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block mb-3">
    <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400 block mb-1">{label}</span>
    {children}
  </label>
);

const inp = "w-full px-3 py-2 text-sm border border-stone-600 bg-stone-800 text-stone-100 focus:border-amber-400 focus:outline-none rounded-sm placeholder:text-stone-500";
const btnP = "text-xs tracking-wider uppercase font-semibold text-stone-900 bg-amber-400 px-4 py-2 hover:bg-amber-300 flex items-center gap-1.5 transition-colors rounded-sm";
const btnS = "text-xs tracking-wider uppercase font-semibold text-stone-300 px-4 py-2 border border-stone-600 hover:border-stone-400 rounded-sm";
const btnD = "text-xs tracking-wider uppercase font-semibold text-red-400 px-3 py-2 hover:bg-red-950 mr-auto flex items-center gap-1.5 rounded-sm";

// ============================================================
// COMMAND DASHBOARD
// ============================================================
const CommandView = ({ tasks, recruits, events, staff, scholarships, onNav }) => {
  const today = '2026-05-09';
  const next72 = events.filter(e => { const d = daysUntil(e.date); return d >= 0 && d <= 3; }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const overdue = tasks.filter(t => t.status !== 'done' && daysUntil(t.due) < 0);
  const dueSoon = tasks.filter(t => t.status !== 'done' && daysUntil(t.due) >= 0 && daysUntil(t.due) <= 2);
  const findStaff = id => staff.find(s => s.id === id);
  const yr = scholarships['2026-27'] || [];
  const totalEq = yr.filter(p => !p.dsa).reduce((s, p) => s + (p.eq || 0), 0);
  const tier1Count = recruits.filter(r => r.tier === '1').length;
  const acctByStaff = staff.map(s => {
    const owned = tasks.filter(t => t.owner === s.id && t.status !== 'done');
    return { staff: s, total: owned.length, overdue: owned.filter(t => daysUntil(t.due) < 0).length };
  }).filter(x => x.total > 0).sort((a, b) => b.overdue - a.overdue || b.total - a.total);

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden border border-stone-700/50 bg-gradient-to-br from-stone-900 via-[#001a47] to-stone-900 p-10 rounded-sm">
        <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, ${PITT_NAVY}, ${PITT_GOLD}, ${PITT_NAVY})` }} />
        <div className="flex items-baseline justify-between mb-5">
          <span className="text-[11px] tracking-[0.4em] uppercase font-bold" style={{ color: PITT_GOLD }}>· Forged in Steel ·</span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-semibold">Pitt Women's Soccer · 2026</span>
        </div>
        <h1 className="font-serif text-5xl text-stone-100 leading-tight tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Command Center<br />
          <span className="text-stone-500 text-3xl">Head Coach · Ben Waldrum</span>
        </h1>
        <div className="mt-5 flex items-center gap-5 text-xs text-stone-400 flex-wrap">
          <span><span className="text-stone-100 font-semibold">{tasks.filter(t => t.status !== 'done').length}</span> open tasks</span>
          <span className="text-stone-700">·</span>
          <span><span className="text-stone-100 font-semibold">{events.length}</span> events scheduled</span>
          <span className="text-stone-700">·</span>
          <span><span className="text-stone-100 font-semibold">{recruits.length}</span> prospects tracked</span>
          <span className="text-stone-700">·</span>
          <span>Eq: <span className={`font-semibold ${totalEq > 14 ? 'text-red-400' : 'text-amber-400'}`}>{fmtEq(totalEq)} / 14.00</span></span>
          {overdue.length > 0 && <><span className="text-stone-700">·</span><span className="text-red-400 font-semibold">{overdue.length} overdue</span></>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-px bg-stone-800/50">
        {[
          { label: 'Equivalency 2026-27', value: fmtEq(totalEq), sub: `of 14.00 · ${(14 - totalEq).toFixed(2)} remaining`, cls: totalEq > 14 ? 'text-red-400' : 'text-stone-500', nav: 'scholarships', icon: Award, accent: totalEq > 14 ? 'border-red-500' : 'border-amber-400' },
          { label: 'Open Tasks', value: tasks.filter(t => t.status !== 'done').length, sub: `${overdue.length} overdue`, cls: overdue.length ? 'text-red-400' : 'text-stone-500', nav: 'accountability', icon: ClipboardList, accent: 'border-blue-500' },
          { label: '2028 Top Prospects', value: tier1Count, sub: `Tier 1 targets · ${recruits.length} total tracked`, cls: 'text-stone-500', nav: 'recruiting', icon: Target, accent: 'border-violet-500' },
          { label: 'Depth Chart', value: Object.values(DEFAULT_DEPTH_CHART[2026]).filter(v => typeof v === 'object' && v.starter).length, sub: 'positions filled · 2026', cls: 'text-stone-500', nav: 'depth', icon: Layers, accent: 'border-emerald-500' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <button key={i} onClick={() => onNav(m.nav)} className={`bg-stone-900 hover:bg-stone-800 p-6 text-left border-t-2 ${m.accent} transition-colors group`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold">{m.label}</div>
                <Icon size={14} className="text-stone-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="font-serif text-4xl text-stone-100 leading-none mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{m.value}</div>
              <div className={`text-xs ${m.cls}`}>{m.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-stone-100" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Upcoming Events</h2>
              <button onClick={() => onNav('calendar')} className="text-xs tracking-wider uppercase font-semibold text-stone-500 hover:text-amber-400 flex items-center gap-1">Calendar <ArrowUpRight size={11} /></button>
            </div>
            {next72.length === 0 ? (
              <div className="bg-stone-900 border border-stone-800 p-8 text-center">
                <div className="text-stone-500 text-sm italic mb-2">No events in the next 72 hours</div>
                <button onClick={() => onNav('calendar')} className={btnP + ' mx-auto'}><Plus size={12} />Add Event</button>
              </div>
            ) : (
              <div className="space-y-1">
                {next72.map(e => {
                  const meta = EVENT_TYPE_META[e.type];
                  const d = daysUntil(e.date);
                  const dayLabel = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : formatDate(e.date);
                  return (
                    <button key={e.id} onClick={() => onNav('calendar')} className="w-full text-left flex items-center gap-4 py-3 px-4 bg-stone-900 border border-stone-800 hover:border-stone-600 transition-colors rounded-sm">
                      <div className={`${meta.color} w-1 self-stretch rounded-full`} />
                      <div className="w-20 shrink-0">
                        <div className="text-[10px] tracking-wider uppercase text-stone-500 font-semibold">{dayLabel}</div>
                        <div className="text-sm font-mono text-stone-200">{e.time}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-stone-100">{e.title}</div>
                        <div className="text-[11px] uppercase tracking-wider text-stone-500">{meta.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Staff Accountability */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-stone-100" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Staff Accountability</h2>
                <div className="text-[11px] text-stone-500 mt-0.5">Coaching staff & front office open workload</div>
              </div>
              <button onClick={() => onNav('accountability')} className="text-xs tracking-wider uppercase font-semibold text-stone-500 hover:text-amber-400 flex items-center gap-1">Full Board <ArrowUpRight size={11} /></button>
            </div>
            {acctByStaff.length === 0 ? (
              <div className="bg-stone-900 border border-stone-800 p-6 text-center text-stone-500 text-sm italic">
                No open tasks. <button onClick={() => onNav('accountability')} className="text-amber-400 hover:underline">Add the first task →</button>
              </div>
            ) : (
              <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 border-b border-stone-800 bg-stone-950">
                  {['Staff', 'Role', 'Open', 'Overdue'].map((h, i) => (
                    <div key={h} className={`${i === 0 ? 'col-span-5' : i === 1 ? 'col-span-3' : 'col-span-2'} text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-500`}>{h}</div>
                  ))}
                </div>
                {acctByStaff.map(({ staff: s, total, overdue: ov }) => (
                  <div key={s.id} className="grid grid-cols-12 px-4 py-3 border-b border-stone-800 last:border-0 items-center hover:bg-stone-800/40">
                    <div className="col-span-5 flex items-center gap-2"><Avatar staff={s} size="sm" /><span className="text-sm text-stone-100 font-medium truncate">{s.name}</span></div>
                    <div className="col-span-3 text-xs text-stone-500 truncate">{s.role}</div>
                    <div className="col-span-2 text-sm font-mono text-stone-200">{total}</div>
                    <div className="col-span-2">{ov > 0 ? <span className="text-sm font-mono text-red-400 font-semibold">{ov}</span> : <span className="text-stone-700 font-mono">—</span>}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Needs Attention */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400">Needs Attention</span>
              {overdue.length > 0 && <span className="text-[10px] font-bold text-red-400">{overdue.length}</span>}
            </div>
            {overdue.length === 0 && dueSoon.length === 0 && (
              <div className="bg-stone-900 border border-stone-800 p-4 text-sm text-stone-500 italic text-center rounded-sm">All clear</div>
            )}
            <div className="space-y-2">
              {overdue.map(t => <button key={t.id} onClick={() => onNav('accountability')} className="w-full text-left bg-red-950/30 border border-red-900/50 p-3 hover:bg-red-950/50 rounded-sm">
                <div className="flex gap-2"><AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" /><div><div className="text-sm text-stone-100 leading-snug">{t.title}</div><div className="text-[11px] text-red-400 mt-0.5">OVERDUE · {Math.abs(daysUntil(t.due))}d</div></div></div>
              </button>)}
              {dueSoon.map(t => <button key={t.id} onClick={() => onNav('accountability')} className="w-full text-left bg-amber-950/30 border border-amber-900/50 p-3 hover:bg-amber-950/50 rounded-sm">
                <div className="flex gap-2"><Clock size={13} className="text-amber-400 mt-0.5 shrink-0" /><div><div className="text-sm text-stone-100 leading-snug">{t.title}</div><div className="text-[11px] text-amber-400 mt-0.5">{daysUntil(t.due) === 0 ? 'Due today' : `Due in ${daysUntil(t.due)}d`}</div></div></div>
              </button>)}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400 mb-3">Quick Actions</div>
            <div className="space-y-1.5">
              {[
                { label: 'Import Data', icon: Upload, nav: 'import' },
                { label: 'Add Task', icon: Plus, nav: 'accountability' },
                { label: 'View Depth Chart', icon: Layers, nav: 'depth' },
                { label: 'Scholarship Engine', icon: Award, nav: 'scholarships' },
              ].map(q => {
                const Icon = q.icon;
                return (
                  <button key={q.label} onClick={() => onNav(q.nav)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 bg-stone-900 border border-stone-800 hover:border-amber-400 hover:text-amber-400 text-stone-300 text-sm transition-colors rounded-sm">
                    <Icon size={14} />{q.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Program KPIs */}
          <div className="bg-stone-950 border border-stone-800 p-4 rounded-sm">
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold mb-4" style={{ color: PITT_GOLD }}>· Forged in Steel ·</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-stone-500">Staff headcount</span><span className="text-stone-200 font-mono">{staff.length}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Tasks done</span><span className="text-stone-200 font-mono">{tasks.filter(t => t.status === 'done').length}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Recruits committed</span><span className="text-stone-200 font-mono">{recruits.filter(r => r.stage === 'committed').length}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Scholarship limit</span><span className="text-stone-200 font-mono">14.00</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ACCOUNTABILITY
// ============================================================
const TaskModal = ({ task, staff, onSave, onClose, onDelete }) => {
  const [d, setD] = useState(task || { id: newId('t'), title: '', owner: staff[0]?.id || '', due: '2026-09-01', status: 'todo', priority: 'medium', category: 'Operations' });
  const isNew = !task;
  return (
    <Modal open onClose={onClose} title={isNew ? 'New Task' : 'Edit Task'} footer={<>
      {!isNew && <button onClick={() => { onDelete(d.id); onClose(); }} className={btnD}><Trash2 size={12} />Delete</button>}
      <button onClick={onClose} className={btnS}>Cancel</button>
      <button onClick={() => { onSave(d); onClose(); }} className={btnP}><Save size={12} />Save</button>
    </>}>
      <Field label="Title"><input autoFocus value={d.title} onChange={e => setD({ ...d, title: e.target.value })} className={inp} placeholder="What needs to be done?" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner"><select value={d.owner} onChange={e => setD({ ...d, owner: e.target.value })} className={inp}>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Due Date"><input type="date" value={d.due} onChange={e => setD({ ...d, due: e.target.value })} className={inp} /></Field>
        <Field label="Status"><select value={d.status} onChange={e => setD({ ...d, status: e.target.value })} className={inp}>{Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</select></Field>
        <Field label="Priority"><select value={d.priority} onChange={e => setD({ ...d, priority: e.target.value })} className={inp}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
        <Field label="Category" ><input value={d.category} onChange={e => setD({ ...d, category: e.target.value })} className={inp} placeholder="Operations, Recruiting…" /></Field>
      </div>
    </Modal>
  );
};

const AccountabilityView = ({ tasks, setTasks, staff }) => {
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [editing, setEditing] = useState(null);
  const cats = [...new Set(tasks.map(t => t.category))];
  const cols = ['todo', 'in_progress', 'review', 'done'];
  const visible = tasks.filter(t => (filterOwner === 'all' || t.owner === filterOwner) && (filterCat === 'all' || t.category === filterCat));
  const findStaff = id => staff.find(s => s.id === id);
  const cycle = (id, e) => { e.stopPropagation(); setTasks(tasks.map(t => t.id !== id ? t : { ...t, status: cols[(cols.indexOf(t.status) + 1) % cols.length] })); };
  const upsert = t => setTasks(tasks.find(x => x.id === t.id) ? tasks.map(x => x.id === t.id ? t : x) : [...tasks, t]);
  const remove = id => setTasks(tasks.filter(t => t.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Coaching Staff & Front Office</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Accountability</h1>
          <p className="text-sm text-stone-500 mt-1">Click any card to edit · → to advance status</p>
        </div>
        <button onClick={() => setEditing('new')} className={btnP}><Plus size={13} /> New Task</button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-stone-500" />
          <button onClick={() => setFilterOwner('all')} className={`text-xs px-2 py-1 border rounded-sm ${filterOwner === 'all' ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-700'}`}>All</button>
          {staff.map(s => <button key={s.id} onClick={() => setFilterOwner(s.id)} className={`flex items-center gap-1 text-xs px-2 py-1 border rounded-sm ${filterOwner === s.id ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-700'}`}><Avatar staff={s} size="sm" />{s.initials}</button>)}
        </div>
        {cats.length > 0 && <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`text-xs px-2 py-1 border rounded-sm ${filterCat === 'all' ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-700'}`}>All</button>
          {cats.map(c => <button key={c} onClick={() => setFilterCat(c)} className={`text-xs px-2 py-1 border rounded-sm ${filterCat === c ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-700'}`}>{c}</button>)}
        </div>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cols.map(col => {
          const colTasks = visible.filter(t => t.status === col);
          const meta = STATUS_META[col];
          return (
            <div key={col} className="bg-stone-950 border-t-2" style={{ borderColor: PITT_GOLD }}>
              <div className="px-3 py-2.5 border-b border-stone-800 flex justify-between bg-stone-900">
                <div className="flex items-center gap-2"><div className={`h-2 w-2 rounded-full ${meta.dot}`} /><span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-300">{meta.label}</span></div>
                <span className="text-xs font-mono text-stone-500">{colTasks.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[180px]">
                {colTasks.map(t => {
                  const owner = findStaff(t.owner);
                  const d = daysUntil(t.due);
                  const ov = d < 0 && t.status !== 'done';
                  return (
                    <div key={t.id} onClick={() => setEditing(t)} className="bg-stone-900 border border-stone-800 hover:border-amber-400/60 p-3 cursor-pointer transition-all rounded-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 border ${PRIORITY_META[t.priority].cls}`}>{PRIORITY_META[t.priority].label}</span>
                        <button onClick={e => cycle(t.id, e)} className="text-[10px] px-1.5 py-0.5 border border-stone-600 text-stone-400 hover:bg-stone-800 rounded-sm">→</button>
                      </div>
                      <div className="text-sm text-stone-100 leading-snug mb-2">{t.title}</div>
                      <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                        <div className="flex items-center gap-1.5">{owner && <Avatar staff={owner} size="sm" />}<span className="text-[10px] uppercase tracking-wider text-stone-500">{t.category}</span></div>
                        <span className={`text-[11px] font-mono ${ov ? 'text-red-400 font-semibold' : 'text-stone-500'}`}>{ov ? `${Math.abs(d)}d late` : d === 0 ? 'today' : formatDate(t.due)}</span>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && <div className="text-xs text-stone-700 italic px-2 py-8 text-center">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
      {editing && <TaskModal task={editing === 'new' ? null : editing} staff={staff} onSave={upsert} onDelete={remove} onClose={() => setEditing(null)} />}
    </div>
  );
};

// ============================================================
// CALENDAR
// ============================================================
const EventModal = ({ event, defaultDate, staff, onSave, onClose, onDelete }) => {
  const [d, setD] = useState(event || { id: newId('e'), date: defaultDate || '2026-08-01', time: '09:00', title: '', type: 'training', staff: [] });
  const toggle = sid => { const has = (d.staff || []).includes(sid); setD({ ...d, staff: has ? d.staff.filter(x => x !== sid) : [...(d.staff || []), sid] }); };
  const isNew = !event;
  return (
    <Modal open onClose={onClose} title={isNew ? 'New Event' : 'Edit Event'} footer={<>
      {!isNew && <button onClick={() => { onDelete(d.id); onClose(); }} className={btnD}><Trash2 size={12} />Delete</button>}
      <button onClick={onClose} className={btnS}>Cancel</button>
      <button onClick={() => { onSave(d); onClose(); }} className={btnP}><Save size={12} />Save</button>
    </>}>
      <Field label="Title"><input autoFocus value={d.title} onChange={e => setD({ ...d, title: e.target.value })} className={inp} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date"><input type="date" value={d.date} onChange={e => setD({ ...d, date: e.target.value })} className={inp} /></Field>
        <Field label="Time"><input type="time" value={d.time} onChange={e => setD({ ...d, time: e.target.value })} className={inp} /></Field>
        <Field label="Type"><select value={d.type} onChange={e => setD({ ...d, type: e.target.value })} className={inp}>{Object.entries(EVENT_TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</select></Field>
      </div>
      <Field label="Staff"><div className="flex flex-wrap gap-2">{staff.map(s => { const on = (d.staff || []).includes(s.id); return <button key={s.id} onClick={() => toggle(s.id)} className={`flex items-center gap-1.5 text-xs px-2 py-1 border rounded-sm ${on ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-800 text-stone-300 border-stone-600'}`}><Avatar staff={s} size="sm" />{s.name}</button>; })}</div></Field>
    </Modal>
  );
};

const CalendarView = ({ events, setEvents, staff }) => {
  const TODAY = '2026-05-09';
  const [filterTypes, setFilterTypes] = useState(Object.keys(EVENT_TYPE_META));
  const [editing, setEditing] = useState(null);
  const [anchor, setAnchor] = useState(() => { const d = new Date(TODAY); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const isoOf = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const toggleType = t => setFilterTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const firstDay = anchor.getDay();
  const gridStart = new Date(anchor); gridStart.setDate(anchor.getDate() - firstDay);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return { iso: isoOf(d), date: d, inMonth: d.getMonth() === anchor.getMonth() }; });
  const evDay = iso => events.filter(e => e.date === iso && filterTypes.includes(e.type)).sort((a, b) => a.time.localeCompare(b.time));
  const upsert = ev => setEvents(events.find(e => e.id === ev.id) ? events.map(e => e.id === ev.id ? ev : e) : [...events, ev]);
  const remove = id => setEvents(events.filter(e => e.id !== id));
  const mLabel = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const mEvents = events.filter(e => filterTypes.includes(e.type) && new Date(e.date+'T00:00').getMonth() === anchor.getMonth() && new Date(e.date+'T00:00').getFullYear() === anchor.getFullYear());

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Operations</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Team Calendar</h1>
          <p className="text-sm text-stone-500 mt-1">Click event to edit · hover day and click + to add</p>
        </div>
        <button onClick={() => setEditing({ _new: true, id: newId('e'), date: isoOf(anchor), time: '09:00', title: '', type: 'training', staff: [] })} className={btnP}><Plus size={13} />New Event</button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth()-1, 1))} className="px-3 py-1.5 border border-stone-700 hover:border-stone-500 text-stone-300 text-sm rounded-sm">←</button>
          <span className="font-serif text-xl text-stone-100 w-52 text-center" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{mLabel}</span>
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth()+1, 1))} className="px-3 py-1.5 border border-stone-700 hover:border-stone-500 text-stone-300 text-sm rounded-sm">→</button>
          <button onClick={() => { const d = new Date(TODAY); setAnchor(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="ml-1 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-stone-700 hover:border-amber-400 text-stone-400 hover:text-amber-400 rounded-sm">Today</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500">
          {['match','training','travel'].map(t => <span key={t}>{EVENT_TYPE_META[t].label}: <span className="text-stone-200 font-mono">{mEvents.filter(e=>e.type===t).length}</span></span>)}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(EVENT_TYPE_META).map(([key, meta]) => (
          <button key={key} onClick={() => toggleType(key)} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-sm transition-colors ${filterTypes.includes(key) ? 'bg-stone-800 border-stone-500 text-stone-100' : 'bg-stone-950 border-stone-800 text-stone-600'}`}>
            <div className={`h-2 w-2 rounded-full ${meta.color}`} />{meta.label}
          </button>
        ))}
      </div>

      <div className="border border-stone-800 rounded-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-stone-950">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(w => <div key={w} className="px-2 py-2 text-[10px] tracking-[0.15em] uppercase font-semibold text-stone-500 text-center border-b border-stone-800">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-stone-800">
          {cells.map(({ iso, date, inMonth }) => {
            const isToday = iso === TODAY;
            const dayEvents = evDay(iso);
            const visible = dayEvents.slice(0, 3);
            const overflow = dayEvents.length - visible.length;
            return (
              <div key={iso} className={`min-h-[110px] flex flex-col group/cell ${inMonth ? 'bg-stone-900' : 'bg-stone-950/70'}`}>
                <div className={`px-2 pt-1 pb-0.5 flex items-center justify-between ${isToday ? 'border-b-2 border-amber-400' : ''}`}>
                  <span className={`text-xs font-mono font-semibold ${isToday ? 'text-stone-900 bg-amber-400 rounded-full h-5 w-5 flex items-center justify-center text-[10px]' : inMonth ? 'text-stone-300' : 'text-stone-700'}`}>{date.getDate()}</span>
                  {date.getDate() === 1 && inMonth === false && <span className="text-[9px] uppercase text-stone-600">{date.toLocaleDateString('en-US',{month:'short'})}</span>}
                  <button onClick={() => setEditing({ _new: true, id: newId('e'), date: iso, time: '09:00', title: '', type: 'training', staff: [] })} className="opacity-0 group-hover/cell:opacity-100 text-stone-500 hover:text-amber-400 transition-opacity"><Plus size={11} /></button>
                </div>
                <div className="px-1 pb-1 space-y-0.5 flex-1">
                  {visible.map(e => {
                    const meta = EVENT_TYPE_META[e.type];
                    return (
                      <button key={e.id} onClick={() => setEditing(e)} className="w-full text-left flex items-center gap-1 px-1 py-0.5 rounded-sm hover:bg-stone-800 group/ev">
                        <div className={`h-1.5 w-1.5 rounded-full ${meta.color} shrink-0`} />
                        <span className="text-[10px] text-stone-500 font-mono shrink-0">{e.time}</span>
                        <span className={`text-[10px] truncate group-hover/ev:text-amber-400 ${inMonth ? 'text-stone-200' : 'text-stone-600'}`}>{e.title}</span>
                      </button>
                    );
                  })}
                  {overflow > 0 && <div className="text-[9px] text-stone-500 px-1">+{overflow} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {editing && <EventModal event={editing._new ? null : editing} defaultDate={editing.date} staff={staff} onSave={ev => upsert({ ...ev, _new: undefined })} onDelete={remove} onClose={() => setEditing(null)} />}
    </div>
  );
};

// ============================================================
// ROSTER
// ============================================================
const PlayerModal = ({ player, onSave, onClose, onDelete }) => {
  const [d, setD] = useState(player || { id: newId('p'), name: '', number: '', position: 'M', year: 'Fr', gpa: 3.0, status: 'available', flag: '', hometown: '', school: '' });
  const isNew = !player;
  return (
    <Modal open onClose={onClose} title={isNew ? 'Add Player' : 'Edit Player'} footer={<>
      {!isNew && <button onClick={() => { onDelete(d.id); onClose(); }} className={btnD}><Trash2 size={12} />Delete</button>}
      <button onClick={onClose} className={btnS}>Cancel</button>
      <button onClick={() => { onSave(d); onClose(); }} className={btnP}><Save size={12} />Save</button>
    </>}>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-3"><Field label="Full Name"><input autoFocus value={d.name} onChange={e => setD({ ...d, name: e.target.value })} className={inp} placeholder="Last, First" /></Field></div>
        <Field label="#"><input type="number" value={d.number} onChange={e => setD({ ...d, number: e.target.value })} className={inp} /></Field>
        <Field label="Position"><select value={d.position} onChange={e => setD({ ...d, position: e.target.value })} className={inp}><option value="GK">GK</option><option value="D">D</option><option value="M">M</option><option value="F">F</option></select></Field>
        <Field label="Year"><select value={d.year} onChange={e => setD({ ...d, year: e.target.value })} className={inp}>{['Fr','So','Jr','Sr','RS/Fr','RS/So','RS/Jr','RS/Sr','Gr'].map(y => <option key={y}>{y}</option>)}</select></Field>
        <Field label="GPA"><input type="number" step="0.01" min="0" max="4" value={d.gpa} onChange={e => setD({ ...d, gpa: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
        <div className="col-span-4"><Field label="Status"><div className="flex gap-2">{['available','limited','out'].map(s => <button key={s} onClick={() => setD({ ...d, status: s })} className={`flex-1 text-xs uppercase tracking-wider font-semibold px-2 py-2 border rounded-sm ${d.status === s ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-800 text-stone-300 border-stone-600'}`}>{s}</button>)}</div></Field></div>
        <div className="col-span-2"><Field label="Hometown"><input value={d.hometown || ''} onChange={e => setD({ ...d, hometown: e.target.value })} className={inp} /></Field></div>
        <div className="col-span-2"><Field label="School / College"><input value={d.school || ''} onChange={e => setD({ ...d, school: e.target.value })} className={inp} placeholder="CAS, ENGR, CBA…" /></Field></div>
        <div className="col-span-4"><Field label="Flag / Note"><textarea value={d.flag} onChange={e => setD({ ...d, flag: e.target.value })} className={inp} rows={2} placeholder="Injury, academic flag, etc." /></Field></div>
      </div>
    </Modal>
  );
};

const RosterView = ({ players, setPlayers }) => {
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const visible = players.filter(p => filter === 'all' || p.status === filter);
  const byPos = ['GK','D','M','F'].map(pos => ({ pos, ps: visible.filter(p => p.position === pos) }));
  const upsert = p => setPlayers(players.find(x => x.id === p.id) ? players.map(x => x.id === p.id ? p : x) : [...players, p]);
  const remove = id => setPlayers(players.filter(p => p.id !== id));
  const totalAvail = players.filter(p => p.status === 'available').length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Personnel</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Roster</h1>
          <p className="text-sm text-stone-500 mt-1">{players.length} student-athletes · {totalAvail} available · click to edit</p>
        </div>
        <div className="flex items-center gap-2">
          {['all','available','limited','out'].map(f => <button key={f} onClick={() => setFilter(f)} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${filter === f ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'}`}>{f}</button>)}
          <button onClick={() => setEditing('new')} className={btnP + ' ml-1'}><Plus size={13} />Add</button>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-16 text-center rounded-sm">
          <Users size={32} className="text-stone-700 mx-auto mb-4" />
          <div className="text-stone-400 text-sm mb-2">No players yet</div>
          <div className="text-stone-600 text-xs mb-6">Add players manually or use the Import Hub to load your roster from a CSV</div>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => setEditing('new')} className={btnP}><Plus size={13} />Add Player</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-px bg-stone-800">
          {byPos.map(({ pos, ps }) => (
            <div key={pos} className="bg-stone-900">
              <div className="px-4 py-3 border-b-2 flex items-baseline justify-between" style={{ borderColor: PITT_GOLD }}>
                <span className="font-serif text-xl text-stone-100" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{pos === 'GK' ? 'Goalkeepers' : pos === 'D' ? 'Defenders' : pos === 'M' ? 'Midfielders' : 'Forwards'}</span>
                <span className="text-xs font-mono text-stone-500">{ps.length}</span>
              </div>
              <div>
                {ps.map(p => (
                  <button key={p.id} onClick={() => setEditing(p)} className="w-full text-left px-4 py-3 border-b border-stone-800 hover:bg-stone-800/50 group rounded-sm">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-mono text-stone-600 text-sm w-6">{p.number}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-100 truncate">{p.name}</div>
                        <div className="text-[11px] text-stone-500">{p.year} · GPA {(p.gpa||0).toFixed(2)}</div>
                      </div>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${p.status === 'available' ? 'bg-emerald-500' : p.status === 'limited' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                    {p.flag && <div className="text-[11px] text-stone-500 italic pl-8 leading-snug">{p.flag}</div>}
                  </button>
                ))}
                {ps.length === 0 && <div className="text-xs text-stone-700 italic px-4 py-6 text-center">None</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <PlayerModal player={editing === 'new' ? null : editing} onSave={upsert} onDelete={remove} onClose={() => setEditing(null)} />}
    </div>
  );
};

// ============================================================
// DEPTH CHART — 4-3-3 CAM variant, real 2026 data
// ============================================================
const DepthSlotEditor = ({ slot, data, depthChart, year, setDepthChart, onClose }) => {
  const [d, setD] = useState(data);
  const save = () => { setDepthChart({ ...depthChart, [year]: { ...depthChart[year], [slot.id]: d } }); onClose(); };
  return (
    <Modal open onClose={onClose} title={`${slot.label} — ${year}`} footer={<>
      <button onClick={() => setD({ starter: '', second: '', third: '', readiness: 'developmental' })} className={btnS}>Clear</button>
      <button onClick={onClose} className={btnS}>Cancel</button>
      <button onClick={save} className={btnP}><Save size={12} />Save</button>
    </>}>
      <Field label="Starter (1st)"><input autoFocus value={d.starter || ''} onChange={e => setD({ ...d, starter: e.target.value })} className={inp} placeholder="Player name" /></Field>
      <Field label="2nd"><input value={d.second || ''} onChange={e => setD({ ...d, second: e.target.value })} className={inp} placeholder="Player name or recruit target" /></Field>
      <Field label="3rd"><input value={d.third || ''} onChange={e => setD({ ...d, third: e.target.value })} className={inp} placeholder="Player name or recruit target" /></Field>
      <Field label="Position Readiness">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(READINESS_META).map(([k, m]) => (
            <button key={k} onClick={() => setD({ ...d, readiness: k })} className={`text-xs uppercase tracking-wider font-semibold px-3 py-2 border flex items-center gap-2 rounded-sm ${d.readiness === k ? 'border-amber-400 bg-stone-800 text-stone-100' : 'bg-stone-800 text-stone-500 border-stone-700'}`}>
              <div className={`h-2 w-2 rounded-full ${m.color}`} />{m.label}
            </button>
          ))}
        </div>
      </Field>
    </Modal>
  );
};

const DepthChartView = ({ depthChart, setDepthChart }) => {
  const [year, setYear] = useState('2026');
  const [editingSlot, setEditingSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const yearData = depthChart[year] || {};
  const filled = FORMATION_433.filter(p => yearData[p.id]?.starter).length;
  const recruitNeeded = FORMATION_433.filter(p => (yearData[p.id]?.readiness || 'developmental') === 'recruit_needed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Tactical Planning · 1-4-3-3</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Depth Chart</h1>
          <p className="text-sm text-stone-500 mt-1">{filled}/11 positions filled · click any position to edit</p>
        </div>
        <div className="flex items-center gap-1.5">
          {['2026','2027','2028','2029'].map(y => (
            <button key={y} onClick={() => setYear(y)} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${year === y ? 'text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'}`} style={year === y ? { backgroundColor: PITT_GOLD } : {}}>{y}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          {Object.entries(READINESS_META).map(([k, m]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-stone-400"><div className={`h-2.5 w-2.5 rounded-full ${m.color}`} />{m.label}</div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-stone-500">Filled: <span className="text-stone-100 font-mono">{filled}/11</span></span>
          {recruitNeeded > 0 && <span className="text-red-400 font-semibold">{recruitNeeded} recruit needed</span>}
        </div>
      </div>

      {/* PITCH */}
      <div className="bg-stone-900 border border-stone-700 p-3 rounded-sm">
        <div className="relative w-full" style={{ aspectRatio: '16/9', background: 'linear-gradient(180deg,#14532d 0%,#166534 50%,#14532d 100%)' }}>
          {/* Stripes */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 55px, rgba(255,255,255,0.05) 55px, rgba(255,255,255,0.05) 110px)' }} />
          {/* Field lines */}
          <svg className="absolute inset-3" viewBox="0 0 100 56" preserveAspectRatio="none" style={{ width: 'calc(100% - 24px)', height: 'calc(100% - 24px)' }}>
            <rect x="0" y="0" width="100" height="56" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />
            <line x1="0" y1="28" x2="100" y2="28" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" strokeDasharray="0.8 0.6" />
            <circle cx="50" cy="28" r="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
            <rect x="18" y="0" width="64" height="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
            <rect x="34" y="0" width="32" height="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
            <rect x="18" y="46" width="64" height="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
            <rect x="34" y="52" width="32" height="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
          </svg>
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] uppercase text-white/40 font-semibold">▲ Attack</div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] uppercase text-white/40 font-semibold">▼ Defend</div>

          {FORMATION_433.map(slot => {
            const data = yearData[slot.id] || { starter: '', second: '', third: '', readiness: 'developmental' };
            const meta = READINESS_META[data.readiness || 'developmental'];
            const initials = data.starter ? data.starter.split(/[\s,]+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() : '—';
            // Positions on the right half get their name panel on the LEFT so it doesn't overflow the pitch edge
            const panelLeft = slot.x > 55;
            const hasBackups = data.second || data.third;
            return (
              <button key={slot.id} onClick={() => setEditingSlot(slot)} className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-transform group" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
                <div className="flex items-start gap-0" style={{ flexDirection: panelLeft ? 'row-reverse' : 'row' }}>
                  {/* Jersey + label */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative">
                      <div className="w-11 h-11 flex items-center justify-center font-bold text-sm shadow-lg" style={{ background: PITT_NAVY, color: PITT_GOLD, clipPath: 'polygon(20% 0,80% 0,100% 22%,80% 32%,80% 100%,20% 100%,20% 32%,0 22%)' }}>
                        {initials}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${meta.color} ring-2 ring-green-900`} />
                    </div>
                    <div className="mt-0.5 text-center">
                      <div className="text-[7px] font-bold tracking-wider px-1 py-0.5 rounded-sm" style={{ backgroundColor: PITT_GOLD, color: PITT_NAVY }}>{slot.label}</div>
                    </div>
                  </div>
                  {/* 2nd & 3rd name panel */}
                  {hasBackups && (
                    <div className={`flex flex-col justify-center self-stretch pb-3 ${panelLeft ? 'items-end pr-1.5' : 'items-start pl-1.5'}`} style={{ minWidth: '72px', maxWidth: '80px' }}>
                      {data.second && (
                        <div className="flex items-center gap-1 mb-0.5" style={{ flexDirection: panelLeft ? 'row-reverse' : 'row' }}>
                          <div className="h-1.5 w-1.5 rounded-sm shrink-0" style={{ background: PITT_GOLD, opacity: 0.8 }} />
                          <span className="text-[8px] text-white/80 font-medium leading-none truncate" style={{ maxWidth: '62px' }}>
                            {data.second.split(/[,\s]+/)[0]}
                          </span>
                        </div>
                      )}
                      {data.third && (
                        <div className="flex items-center gap-1" style={{ flexDirection: panelLeft ? 'row-reverse' : 'row' }}>
                          <div className="h-1.5 w-1.5 rounded-sm shrink-0" style={{ background: PITT_GOLD, opacity: 0.45 }} />
                          <span className="text-[8px] text-white/50 font-medium leading-none truncate" style={{ maxWidth: '62px' }}>
                            {data.third.split(/[,\s]+/)[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary table + notes */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-800 bg-stone-950 flex justify-between">
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400">{year} · All Positions</span>
            <span className="text-[10px] text-stone-600">Click to edit</span>
          </div>
          <div className="divide-y divide-stone-800">
            {FORMATION_433.map(slot => {
              const data = yearData[slot.id] || {};
              const meta = READINESS_META[data.readiness || 'developmental'];
              return (
                <button key={slot.id} onClick={() => setEditingSlot(slot)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-stone-800/40 text-left">
                  <span className="text-[10px] font-bold tracking-wider w-9 text-center py-0.5 rounded-sm" style={{ backgroundColor: PITT_GOLD, color: PITT_NAVY }}>{slot.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-100 truncate">{data.starter || <span className="text-stone-600 italic">unassigned</span>}</div>
                    <div className="text-[10px] text-stone-500 truncate">{[data.second && `2: ${data.second}`, data.third && `3: ${data.third}`].filter(Boolean).join(' · ') || <span className="italic text-stone-700">no backups</span>}</div>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${meta.color}`} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-sm">
            <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400 mb-2">Roster Notes — {year}</div>
            <textarea value={depthChart[year]?.rosterNotes || ''} onChange={e => setDepthChart({ ...depthChart, [year]: { ...depthChart[year], rosterNotes: e.target.value } })} className={inp} rows={4} placeholder="Transfer portal targets, class balance, team needs…" />
          </div>
          <div className="bg-stone-950 border border-stone-800 p-4 rounded-sm">
            <div className="text-[10px] tracking-[0.2em] uppercase font-semibold mb-3" style={{ color: PITT_GOLD }}>Position Health · {year}</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(READINESS_META).map(([k, m]) => {
                const count = FORMATION_433.filter(p => (yearData[p.id]?.readiness || 'developmental') === k).length;
                return (
                  <div key={k} className="flex items-center justify-between bg-stone-900 px-3 py-2 rounded-sm">
                    <div className="flex items-center gap-2"><div className={`h-2 w-2 rounded-full ${m.color}`} /><span className="text-xs text-stone-300">{m.label}</span></div>
                    <span className="text-sm font-mono text-stone-100">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {editingSlot && <DepthSlotEditor slot={editingSlot} data={yearData[editingSlot.id] || { starter: '', second: '', third: '', readiness: 'developmental' }} depthChart={depthChart} year={year} setDepthChart={setDepthChart} onClose={() => setEditingSlot(null)} />}
    </div>
  );
};

// ============================================================
// SCHOLARSHIPS
// ============================================================
const ScholarshipRowEditor = ({ row, onSave, onClose, onDelete }) => {
  const [d, setD] = useState(row || { id: newId('sc'), name: '', year: 'Fr', dsa: false, school: '', eq: 0, dollars: 0, period: 'Year', notes: '', confirmed: false });
  const isNew = !row;
  return (
    <Modal open onClose={onClose} title={isNew ? 'Add Recipient' : 'Edit Recipient'} wide footer={<>
      {!isNew && <button onClick={() => { onDelete(d.id); onClose(); }} className={btnD}><Trash2 size={12} />Delete</button>}
      <button onClick={onClose} className={btnS}>Cancel</button>
      <button onClick={() => { onSave(d); onClose(); }} className={btnP}><Save size={12} />Save</button>
    </>}>
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-4"><Field label="Player Name (Last, First)"><input autoFocus value={d.name} onChange={e => setD({ ...d, name: e.target.value })} className={inp} /></Field></div>
        <Field label="Class"><select value={d.year} onChange={e => setD({ ...d, year: e.target.value })} className={inp}>{['Fr','So','Jr','Sr','RS/Fr','RS/So','RS/Jr','RS/Sr','GRAD'].map(y => <option key={y}>{y}</option>)}</select></Field>
        <Field label="School"><input value={d.school} onChange={e => setD({ ...d, school: e.target.value })} className={inp} placeholder="CAS, ENGR…" /></Field>
        <Field label="Eq."><input type="number" step="0.01" min="0" max="1" value={d.eq} onChange={e => setD({ ...d, eq: parseFloat(e.target.value) || 0 })} className={inp} disabled={d.dsa} /></Field>
        <div className="col-span-2"><Field label="$ Amount"><input type="number" step="100" value={d.dollars} onChange={e => setD({ ...d, dollars: parseInt(e.target.value) || 0 })} className={inp} /></Field></div>
        <Field label="Period"><select value={d.period} onChange={e => setD({ ...d, period: e.target.value })} className={inp}><option>Year</option><option>Semester</option></select></Field>
        <div className="col-span-6"><Field label="DSA / Confirmed"><div className="flex gap-2">
          <button onClick={() => setD({ ...d, dsa: !d.dsa, eq: !d.dsa ? 0 : d.eq })} className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold border rounded-sm ${d.dsa ? 'bg-violet-500 text-white border-violet-500' : 'bg-stone-800 text-stone-300 border-stone-600'}`}>DSA</button>
          <button onClick={() => setD({ ...d, confirmed: !d.confirmed })} className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold border rounded-sm ${d.confirmed ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-stone-800 text-stone-300 border-stone-600'}`}>Confirmed</button>
        </div></Field></div>
        <div className="col-span-6"><Field label="Notes"><textarea value={d.notes} onChange={e => setD({ ...d, notes: e.target.value })} className={inp} rows={2} /></Field></div>
      </div>
    </Modal>
  );
};

const ScholarshipsView = ({ scholarships, setScholarships }) => {
  const years = ['2026-27', '2027-28', '2028-29', '2025-26'];
  const [year, setYear] = useState('2026-27');
  const [editing, setEditing] = useState(null);
  const [log, setLog] = useState([]);
  const [showLog, setShowLog] = useState(false);

  const yearData = scholarships[year] || [];
  const nonDsa = yearData.filter(p => !p.dsa);
  const totalEq = nonDsa.reduce((s, p) => s + (p.eq || 0), 0);
  const remaining = Math.max(0, 14 - totalEq);
  const overLimit = totalEq > 14;
  const totalDollars = yearData.reduce((s, p) => s + (p.dollars || 0), 0);
  const sorted = [...yearData].sort((a, b) => (b.eq || 0) - (a.eq || 0));

  const updateRow = (id, field, val) => setScholarships({ ...scholarships, [year]: yearData.map(p => p.id === id ? { ...p, [field]: val } : p) });
  const upsertRow = row => { const exists = yearData.find(p => p.id === row.id); setScholarships({ ...scholarships, [year]: exists ? yearData.map(p => p.id === row.id ? row : p) : [...yearData, row] }); };
  const removeRow = id => setScholarships({ ...scholarships, [year]: yearData.filter(p => p.id !== id) });

  const doGrad = id => { const p = yearData.find(x => x.id === id); if (!p || !confirm(`Graduate ${p.name}? Frees ${fmtEq(p.eq)} eq · ${fmtMoney(p.dollars)}`)) return; removeRow(id); setLog([{ ts: Date.now(), text: `[${year}] Graduated ${p.name} · freed ${fmtEq(p.eq)} eq · ${fmtMoney(p.dollars)}` }, ...log]); };
  const doPortal = id => { const p = yearData.find(x => x.id === id); if (!p || !confirm(`Portal: ${p.name}? Frees ${fmtEq(p.eq)} eq`)) return; removeRow(id); setLog([{ ts: Date.now(), text: `[${year}] Portal: ${p.name} · freed ${fmtEq(p.eq)} eq` }, ...log]); };
  const pct = Math.min(100, (totalEq / 14) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Compliance · NCAA</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Scholarship Management</h1>
          <p className="text-sm text-stone-500 mt-1">Live equivalency · scenario engine · 14.00 NCAA limit</p>
        </div>
        <div className="flex items-center gap-1.5">
          {years.map(y => <button key={y} onClick={() => setYear(y)} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${year === y ? 'text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'}`} style={year === y ? { backgroundColor: PITT_GOLD } : {}}>{y}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-stone-800">
        {[
          { label: 'Equivalency Used', val: fmtEq(totalEq), sub: `of 14.00 · ${(14-totalEq).toFixed(2)} remaining`, accent: overLimit ? 'border-red-500' : 'border-amber-400' },
          { label: 'Eq. Remaining', val: fmtEq(remaining), sub: `${((remaining/14)*100).toFixed(1)}% of budget`, accent: 'border-emerald-500' },
          { label: 'Athletic Aid', val: '$' + Math.round(totalDollars/1000) + 'k', sub: fmtMoney(totalDollars), accent: 'border-blue-500' },
          { label: `Roster · ${year}`, val: yearData.length, sub: `${yearData.filter(p=>p.dsa).length} DSA · ${nonDsa.length} on scholarship`, accent: 'border-violet-500' },
        ].map((m, i) => (
          <div key={i} className={`bg-stone-900 p-5 border-t-2 ${m.accent}`}>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold mb-2">{m.label}</div>
            <div className="font-serif text-3xl text-stone-100 leading-none mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{m.val}</div>
            <div className="text-xs text-stone-500">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Eq bar */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400">Equivalency Usage · {year}</span>
          {overLimit && <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><AlertTriangle size={12} />OVER LIMIT</span>}
        </div>
        <div className="relative h-7 bg-stone-950 rounded overflow-hidden">
          <div className="absolute inset-y-0 left-0 transition-all rounded" style={{ width: `${pct}%`, background: overLimit ? '#dc2626' : `linear-gradient(90deg,${PITT_NAVY},${PITT_GOLD})` }} />
          <div className="absolute inset-0 flex items-center px-3"><span className="text-xs font-mono text-white font-semibold drop-shadow">{fmtEq(totalEq)} / 14.00</span></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-stone-700" />
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-mono text-stone-600"><span>0.00</span><span>7.00</span><span>14.00</span></div>
      </div>

      {/* Scenario bar */}
      <div className="bg-stone-950 border border-stone-800 p-4 rounded-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5"><Zap size={13} className="text-amber-400" /><span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: PITT_GOLD }}>Scenario Engine</span></div>
            <div className="text-xs text-stone-500">Hover any row — Grad or Portal frees equivalency immediately</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing('new')} className="text-xs tracking-wider uppercase font-semibold text-stone-300 px-3 py-1.5 border border-stone-600 hover:border-amber-400 hover:text-amber-400 flex items-center gap-1 rounded-sm"><Plus size={11} />Add</button>
            <button onClick={() => setShowLog(!showLog)} className="text-xs tracking-wider uppercase font-semibold text-stone-400 px-3 py-1.5 border border-stone-700 hover:border-stone-500 rounded-sm">Log ({log.length})</button>
          </div>
        </div>
        {showLog && <div className="border-t border-stone-800 mt-3 pt-3 max-h-32 overflow-y-auto space-y-0.5">{log.length === 0 ? <div className="text-xs text-stone-600 italic">No actions yet.</div> : log.map(l => <div key={l.ts} className="text-xs text-stone-400 font-mono">{new Date(l.ts).toLocaleTimeString()} · {l.text}</div>)}</div>}
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-xl text-stone-100" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Recipients · {year}</h2>
          <span className="text-xs text-stone-500">Click name to edit full record · hover for scenario actions</span>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
          <div className="grid px-4 py-2 border-b-2 bg-stone-950 text-[10px] tracking-[0.15em] uppercase font-semibold text-stone-400" style={{ borderColor: PITT_NAVY, gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 2fr 2fr 2fr' }}>
            {['Player','Class','School','Period','Eq.','$ Amount','Notes',''].map((h, i) => <div key={i}>{h}</div>)}
          </div>
          {sorted.map(p => (
            <div key={p.id} className="grid px-4 py-2 border-b border-stone-800 last:border-0 items-center hover:bg-stone-800/30 group" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 2fr 2fr 2fr' }}>
              <button onClick={() => setEditing(p)} className="text-sm text-stone-100 font-medium truncate hover:text-amber-400 text-left flex items-center gap-2">
                {p.name}
                {p.dsa && <span className="text-[9px] uppercase px-1 py-0.5 bg-violet-950 text-violet-300 border border-violet-800 rounded-sm">DSA</span>}
              </button>
              <div className="text-xs text-stone-400">{p.year}</div>
              <div className="text-xs text-stone-400 font-mono">{p.school || '—'}</div>
              <button onClick={() => updateRow(p.id, 'period', p.period === 'Year' ? 'Semester' : 'Year')} className={`text-[10px] uppercase font-semibold w-fit px-1.5 py-0.5 rounded-sm ${p.period === 'Semester' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-stone-800 text-stone-500 border border-stone-700'}`}>{p.period}</button>
              <input type="number" step="0.01" min="0" max="1" value={p.eq} onChange={e => updateRow(p.id, 'eq', parseFloat(e.target.value)||0)} disabled={p.dsa} className="bg-transparent text-sm font-mono text-stone-100 w-14 px-1 py-0.5 border border-transparent hover:border-stone-600 focus:border-amber-400 focus:outline-none disabled:text-stone-700 rounded-sm" />
              <input type="number" step="100" value={p.dollars} onChange={e => updateRow(p.id, 'dollars', parseInt(e.target.value)||0)} className="bg-transparent text-sm font-mono text-stone-100 w-24 px-1 py-0.5 border border-transparent hover:border-stone-600 focus:border-amber-400 focus:outline-none rounded-sm" />
              <button onClick={() => setEditing(p)} className="text-[11px] text-stone-500 italic truncate hover:text-stone-300 text-left" title={p.notes}>{p.notes || '—'}</button>
              <div className="flex items-center gap-2">
                <button onClick={() => updateRow(p.id,'confirmed',!p.confirmed)} className={`text-[10px] uppercase font-semibold w-fit px-2 py-0.5 rounded-sm ${p.confirmed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>{p.confirmed ? '✓' : '!'}</button>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button onClick={() => doGrad(p.id)} className="text-[10px] px-1.5 py-0.5 border border-stone-700 text-stone-400 hover:border-emerald-500 hover:text-emerald-400 rounded-sm">Grad</button>
                  <button onClick={() => doPortal(p.id)} className="text-[10px] px-1.5 py-0.5 border border-stone-700 text-stone-400 hover:border-red-500 hover:text-red-400 rounded-sm">Portal</button>
                </div>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <div className="px-4 py-12 text-center text-sm text-stone-500 italic">No recipients for {year}. Click "Add" to add one.</div>}
        </div>
      </div>
      {editing && <ScholarshipRowEditor row={editing === 'new' ? null : editing} onSave={upsertRow} onDelete={removeRow} onClose={() => setEditing(null)} />}
    </div>
  );
};

// ============================================================
// RECRUITING — real 2028 tier system
// ============================================================
const RecruitModal = ({ recruit, onSave, onClose, onDelete }) => {
  const [d, setD] = useState(recruit || { id: newId('r'), name: '', pos: '', club: '', league: 'ECNL', tier: '2', phone: '', handle: '', email: '', notes: '', class: '2028', stage: 'identified' });
  const isNew = !recruit;
  return (
    <Modal open onClose={onClose} title={isNew ? 'Add Recruit' : 'Edit Recruit'} wide footer={<>
      {!isNew && <button onClick={() => { onDelete(d.id); onClose(); }} className={btnD}><Trash2 size={12} />Delete</button>}
      <button onClick={onClose} className={btnS}>Cancel</button>
      <button onClick={() => { onSave(d); onClose(); }} className={btnP}><Save size={12} />Save</button>
    </>}>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-2"><Field label="Name"><input autoFocus value={d.name} onChange={e => setD({ ...d, name: e.target.value })} className={inp} /></Field></div>
        <Field label="Position"><input value={d.pos} onChange={e => setD({ ...d, pos: e.target.value })} className={inp} placeholder="F, MF, CB, GK…" /></Field>
        <Field label="Class Year"><select value={d.class} onChange={e => setD({ ...d, class: e.target.value })} className={inp}>{['2026','2027','2028','2029','2030'].map(y => <option key={y}>{y}</option>)}</select></Field>
        <div className="col-span-2"><Field label="Club"><input value={d.club} onChange={e => setD({ ...d, club: e.target.value })} className={inp} /></Field></div>
        <Field label="League"><select value={d.league} onChange={e => setD({ ...d, league: e.target.value })} className={inp}><option>ECNL</option><option>GA</option><option>NPL</option><option>Other</option></select></Field>
        <Field label="Tier"><select value={d.tier} onChange={e => setD({ ...d, tier: e.target.value })} className={inp}><option value="1">Tier 1</option><option value="1/2">Tier 1/2</option><option value="2/1">Tier 2/1</option><option value="2">Tier 2</option><option value="2/3">Tier 2/3</option><option value="3/2">Tier 3/2</option><option value="3">Tier 3</option><option value="4">Tier 4</option></select></Field>
        <Field label="Stage"><select value={d.stage} onChange={e => setD({ ...d, stage: e.target.value })} className={inp}>{RECRUIT_STAGES.map(s => <option key={s} value={s}>{RECRUIT_STAGE_LABELS[s]}</option>)}</select></Field>
        <Field label="Phone"><input value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} className={inp} /></Field>
        <Field label="IG/Twitter"><input value={d.handle} onChange={e => setD({ ...d, handle: e.target.value })} className={inp} placeholder="@handle" /></Field>
        <div className="col-span-2"><Field label="Email"><input value={d.email} onChange={e => setD({ ...d, email: e.target.value })} className={inp} /></Field></div>
        <div className="col-span-4"><Field label="Notes"><textarea value={d.notes} onChange={e => setD({ ...d, notes: e.target.value })} className={inp} rows={2} /></Field></div>
      </div>
    </Modal>
  );
};

const RecruitingView = ({ recruits, setRecruits }) => {
  const [classFilter, setClassFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('pipeline');

  const classes = [...new Set(recruits.map(r => r.class))].sort();
  const visible = recruits.filter(r =>
    (classFilter === 'all' || r.class === classFilter) &&
    (tierFilter === 'all' || r.tier === tierFilter || r.tier?.startsWith(tierFilter)) &&
    (stageFilter === 'all' || r.stage === stageFilter) &&
    (!search || r.name.toLowerCase().includes(search.toLowerCase()) || r.club?.toLowerCase().includes(search.toLowerCase()) || r.pos?.toLowerCase().includes(search.toLowerCase()))
  );
  const upsert = r => setRecruits(recruits.find(x => x.id === r.id) ? recruits.map(x => x.id === r.id ? r : x) : [...recruits, r]);
  const remove = id => setRecruits(recruits.filter(r => r.id !== id));
  const advanceStage = (id, e) => { e.stopPropagation(); const idx = RECRUIT_STAGES.indexOf(recruits.find(r => r.id === id)?.stage || 'identified'); if (idx < RECRUIT_STAGES.length - 1) setRecruits(recruits.map(r => r.id === id ? { ...r, stage: RECRUIT_STAGES[idx+1] } : r)); };

  const tierBadge = t => {
    const color = t === '1' ? 'bg-amber-500 text-stone-900' : t?.includes('1') ? 'bg-amber-400/70 text-stone-900' : t === '2' || t === '2/1' ? 'bg-blue-600 text-white' : 'bg-stone-700 text-stone-300';
    return <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${color}`}>T{t}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Pipeline · Class of 2028</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Recruiting</h1>
          <p className="text-sm text-stone-500 mt-1">{recruits.length} prospects · {recruits.filter(r=>r.tier==='1').length} Tier 1 · {recruits.filter(r=>r.stage==='committed').length} committed</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('pipeline')} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${view === 'pipeline' ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700'}`}>Pipeline</button>
          <button onClick={() => setView('list')} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${view === 'list' ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700'}`}>List</button>
          <button onClick={() => setEditing('new')} className={btnP}><Plus size={13} />Add</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, club, position…" className="pl-8 pr-3 py-1.5 text-xs border border-stone-700 bg-stone-900 text-stone-200 focus:border-amber-400 focus:outline-none rounded-sm w-56" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setClassFilter('all')} className={`text-xs px-2.5 py-1.5 border rounded-sm ${classFilter === 'all' ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-700'}`}>All Classes</button>
          {classes.map(c => <button key={c} onClick={() => setClassFilter(c)} className={`text-xs px-2.5 py-1.5 border rounded-sm ${classFilter === c ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-700'}`}>'{c.slice(2)}</button>)}
        </div>
        <div className="flex gap-1.5">
          {['all','1','2','3'].map(t => <button key={t} onClick={() => setTierFilter(t)} className={`text-xs px-2.5 py-1.5 border rounded-sm ${tierFilter === t ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-700'}`}>{t === 'all' ? 'All Tiers' : `Tier ${t}`}</button>)}
        </div>
      </div>

      {view === 'pipeline' ? (
        <div className="grid grid-cols-5 gap-2">
          {RECRUIT_STAGES.map((stage, idx) => {
            const stR = visible.filter(r => r.stage === stage);
            return (
              <div key={stage} className="bg-stone-950 rounded-sm">
                <div className="px-3 py-2.5 bg-stone-900 border-b-2 flex items-center justify-between rounded-t-sm" style={{ borderColor: PITT_GOLD }}>
                  <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-stone-300">{RECRUIT_STAGE_LABELS[stage]}</span>
                  <span className="text-xs font-mono text-stone-500">{stR.length}</span>
                </div>
                <div className="p-2 space-y-1.5 min-h-[250px]">
                  {stR.map(r => (
                    <button key={r.id} onClick={() => setEditing(r)} className="w-full text-left bg-stone-900 border border-stone-800 p-2.5 hover:border-amber-400/60 rounded-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        {tierBadge(r.tier)}
                        <span className="text-[10px] uppercase text-stone-500">{r.class}</span>
                      </div>
                      <div className="text-sm font-medium text-stone-100 leading-tight mb-0.5">{r.name}</div>
                      <div className="text-[11px] text-stone-500">{r.pos} · {r.club}</div>
                      {r.notes && <div className="text-[10px] text-stone-600 italic mt-1 leading-snug truncate">{r.notes}</div>}
                      <div className="mt-2 flex items-center gap-2">
                        {r.phone && <Phone size={10} className="text-stone-600" />}
                        {r.email && <Mail size={10} className="text-stone-600" />}
                        {r.handle && <AtSign size={10} className="text-stone-600" />}
                        {stage !== 'committed' && <button onClick={e => advanceStage(r.id, e)} className="ml-auto text-[9px] uppercase text-stone-500 hover:text-amber-400 border border-stone-700 px-1.5 py-0.5 rounded-sm">→</button>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
          <div className="grid px-4 py-2 border-b border-stone-800 bg-stone-950 text-[10px] tracking-[0.15em] uppercase font-semibold text-stone-400" style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr 2fr' }}>
            {['Name','Pos','Club / League','Tier','Stage','Contact'].map(h => <div key={h}>{h}</div>)}
          </div>
          {visible.map(r => (
            <div key={r.id} onClick={() => setEditing(r)} className="grid px-4 py-2.5 border-b border-stone-800 last:border-0 items-center hover:bg-stone-800/40 cursor-pointer" style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr 2fr' }}>
              <div className="text-sm font-medium text-stone-100">{r.name}</div>
              <div className="text-xs text-stone-400">{r.pos}</div>
              <div className="text-xs text-stone-400 truncate">{r.club} · {r.league}</div>
              <div>{tierBadge(r.tier)}</div>
              <div className="text-[10px] uppercase text-stone-500">{RECRUIT_STAGE_LABELS[r.stage]}</div>
              <div className="flex items-center gap-2 text-stone-500">
                {r.phone && <span className="flex items-center gap-1 text-[10px]"><Phone size={10} />{r.phone}</span>}
                {r.email && <Mail size={10} title={r.email} />}
              </div>
            </div>
          ))}
          {visible.length === 0 && <div className="px-4 py-12 text-center text-sm text-stone-500 italic">No recruits match filters</div>}
        </div>
      )}
      {editing && <RecruitModal recruit={editing === 'new' ? null : editing} onSave={upsert} onDelete={remove} onClose={() => setEditing(null)} />}
    </div>
  );
};

// ============================================================
// STAFF
// ============================================================
const StaffModal = ({ member, onSave, onClose, onDelete }) => {
  const [d, setD] = useState(member || { id: newId('s'), name: '', role: '', initials: '', color: STAFF_COLORS[0], area: '' });
  const isNew = !member;
  const handleName = name => setD({ ...d, name, initials: initialsFrom(name) });
  return (
    <Modal open onClose={onClose} title={isNew ? 'New Staff Member' : 'Edit Staff Member'} footer={<>
      {!isNew && <button onClick={() => { onDelete(d.id); onClose(); }} className={btnD}><Trash2 size={12} />Delete</button>}
      <button onClick={onClose} className={btnS}>Cancel</button>
      <button onClick={() => { onSave(d); onClose(); }} className={btnP}><Save size={12} />Save</button>
    </>}>
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-stone-700">
        <div className={`h-14 w-14 ${d.color} rounded-full flex items-center justify-center text-white font-bold text-xl ring-4 ring-stone-900`}>{d.initials || '??'}</div>
        <div className="text-sm text-stone-500">Initials update automatically from name</div>
      </div>
      <Field label="Full Name"><input autoFocus value={d.name} onChange={e => handleName(e.target.value)} className={inp} /></Field>
      <Field label="Title / Role"><input value={d.role} onChange={e => setD({ ...d, role: e.target.value })} className={inp} /></Field>
      <Field label="Area of Responsibility"><textarea value={d.area || ''} onChange={e => setD({ ...d, area: e.target.value })} className={inp} rows={2} /></Field>
      <Field label="Avatar Color"><div className="flex flex-wrap gap-2">{STAFF_COLORS.map(c => <button key={c} onClick={() => setD({ ...d, color: c })} className={`h-7 w-7 ${c} rounded-full ring-2 ${d.color === c ? 'ring-amber-400 ring-offset-2 ring-offset-stone-900' : 'ring-white/10'}`} />)}</div></Field>
    </Modal>
  );
};

const StaffView = ({ staff, setStaff }) => {
  const [editing, setEditing] = useState(null);
  const upsert = s => setStaff(staff.find(x => x.id === s.id) ? staff.map(x => x.id === s.id ? s : x) : [...staff, s]);
  const remove = id => setStaff(staff.filter(s => s.id !== id));
  const isTBD = s => s.name === 'TBD';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">People</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Staff & Front Office</h1>
          <p className="text-sm text-stone-500 mt-1">{staff.length} positions · {staff.filter(isTBD).length} open · click to edit</p>
        </div>
        <button onClick={() => setEditing('new')} className={btnP}><Plus size={13} />New Staff</button>
      </div>
      <div className="grid grid-cols-3 gap-px bg-stone-800/50">
        {staff.map(s => (
          <button key={s.id} onClick={() => setEditing(s)} className={`p-5 hover:bg-stone-800/60 group text-left rounded-sm ${isTBD(s) ? 'bg-stone-900/60 border border-dashed border-stone-700' : 'bg-stone-900'}`}>
            <div className="flex items-start gap-3">
              <Avatar staff={s} size="lg" />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold leading-tight ${isTBD(s) ? 'text-stone-500 italic' : 'text-stone-100'}`}>{isTBD(s) ? 'Position Open' : s.name}</div>
                <div className="text-xs text-stone-500 mt-0.5">{s.role}</div>
                {isTBD(s) && <div className="text-[10px] text-amber-400 mt-1 uppercase tracking-wider font-semibold">Hiring</div>}
              </div>
              <Edit2 size={13} className="text-stone-700 group-hover:text-amber-400 shrink-0" />
            </div>
          </button>
        ))}
      </div>
      {editing && <StaffModal member={editing === 'new' ? null : editing} onSave={upsert} onDelete={remove} onClose={() => setEditing(null)} />}
    </div>
  );
};

// ============================================================
// IMPORT HUB
// ============================================================
const ImportHub = ({ setPlayers, setRecruits, setStaff, onNav }) => {
  const [activeTab, setActiveTab] = useState('roster');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  const parseCSV = (text) => {
    // Robust parser: handles quoted fields, commas inside quotes, CRLF line endings
    const splitLine = (line) => {
      const result = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
          else { inQuote = !inQuote; }
        } else if (ch === ',' && !inQuote) {
          result.push(cur.trim()); cur = '';
        } else { cur += ch; }
      }
      result.push(cur.trim());
      return result;
    };
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const vals = splitLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim(); });
      return obj;
    }).filter(r => Object.values(r).some(v => v));
    return { headers, rows };
  };

  const configs = {
    roster: {
      label: 'Roster',
      icon: Users,
      columns: 'Name, Number, Position (GK/D/M/F), Year (Fr/So/Jr/Sr), GPA, Status (available/limited/out), School, Flag',
      example: 'Smith, Jane,9,F,Sr,3.75,available,CAS,\nDoe, Maria,1,GK,Jr,3.50,limited,ENGR,Right ankle',
      parse: rows => {
        // Detect which column has the player name — handle "name", "player", "full name", "last, first" etc.
        const nameKey = Object.keys(rows[0] || {}).find(k => ['name','player','full name','last, first','athlete'].includes(k)) || 'name';
        const posKey  = Object.keys(rows[0] || {}).find(k => ['position','pos','positions'].includes(k)) || 'position';
        const yrKey   = Object.keys(rows[0] || {}).find(k => ['year','class','yr','class year'].includes(k)) || 'year';
        const numKey  = Object.keys(rows[0] || {}).find(k => ['number','#','jersey','jersey #','no','no.'].includes(k)) || 'number';
        const gpaKey  = Object.keys(rows[0] || {}).find(k => ['gpa','grade point average'].includes(k)) || 'gpa';
        const statKey = Object.keys(rows[0] || {}).find(k => ['status','availability'].includes(k)) || 'status';
        const schKey  = Object.keys(rows[0] || {}).find(k => ['school','college','major','college/school'].includes(k)) || 'school';
        const flagKey = Object.keys(rows[0] || {}).find(k => ['flag','note','notes','injury','flag / note'].includes(k)) || 'flag';
        // Map position values to GK/D/M/F
        const mapPos = raw => {
          const p = (raw || '').toUpperCase().trim();
          if (['GK','G','GOALKEEPER','GOALIE'].includes(p)) return 'GK';
          if (['D','DEF','DEFENDER','CB','LB','RB','FB'].includes(p)) return 'D';
          if (['M','MF','MID','MIDFIELDER','CM','CDM','CAM','DM','AM'].includes(p)) return 'M';
          if (['F','FWD','FORWARD','ST','LW','RW','ATT','ATTACKER','STRIKER'].includes(p)) return 'F';
          return p.slice(0,2) || 'M';
        };
        return rows.map(r => ({
          id: newId('p'),
          name: (r[nameKey] || '').trim(),
          number: (r[numKey] || '').trim(),
          position: mapPos(r[posKey]),
          year: (r[yrKey] || 'Fr').trim(),
          gpa: parseFloat(r[gpaKey]) || 0,
          status: (r[statKey] || 'available').toLowerCase().trim(),
          school: (r[schKey] || '').trim(),
          flag: (r[flagKey] || '').trim(),
          hometown: (r.hometown || r.city || r.home || '').trim(),
        })).filter(p => p.name);
      },
      // Replace entire roster on import (not append) — coach can clear and re-import any time
      commit: (parsed, setFn) => setFn(parsed),
    },
    recruits: {
      label: 'Recruits',
      icon: Target,
      columns: 'Name, Position, Club, League, Rating/Tier, Cell Phone, Twitter/IG Handle, Email, Notes',
      example: 'Jane Smith,F,Solar FC,ECNL,Tier 1,555-123-4567,@janesmith,jane@email.com,Gotham ID',
      parse: rows => rows.map(r => ({
        id: newId('r'),
        name: r.name || '',
        pos: r.position || r.pos || '',
        club: r.club || '',
        league: r.league || 'ECNL',
        tier: (r.rating || r.tier || '').replace(/tier\s*/i, '').replace('/','').trim() || '3',
        phone: r['cell phone'] || r.phone || '',
        handle: r['twitter/ig handle'] || r.handle || r.twitter || '',
        email: r.email || '',
        notes: r.notes || r.note || '',
        class: r['class year'] || r.class || '2028',
        stage: 'identified',
      })).filter(p => p.name),
      commit: (parsed, setFn) => { const norm = t => t.replace(/tier\s*/i,'').trim(); setFn(prev => { const existing = new Set(prev.map(r => r.name.toLowerCase())); return [...prev, ...parsed.filter(r => !existing.has(r.name.toLowerCase()))].map(r => ({ ...r, tier: norm(r.tier) })); }); },
    },
    staff: {
      label: 'Staff',
      icon: Users,
      columns: 'Staff (name), Title, Area of responsibility',
      example: 'Jane Smith,Assistant Coach,Recruiting / Administrative',
      parse: rows => rows.map((r, i) => ({
        id: newId('s'),
        name: (r.staff || r.name || '').trim(),
        role: (r.title || r.role || '').trim(),
        area: (r['area of responsibility'] || r.area || '').trim(),
        initials: initialsFrom((r.staff || r.name || '').trim()),
        color: STAFF_COLORS[i % STAFF_COLORS.length],
      })).filter(s => s.name && s.name !== 'TBD'),
      commit: (parsed, setFn) => setFn(parsed),
    },
  };

  const loadFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCsvText(ev.target.result); setPreview(null); setError(''); setSuccess(''); };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (!csvText.trim()) { setError('Paste CSV text or upload a file first.'); return; }
    try {
      const cfg = configs[activeTab];
      const { rows } = parseCSV(csvText);
      const parsed = cfg.parse(rows);
      if (parsed.length === 0) { setError('No valid rows found. Check your column headers match the expected format.'); return; }
      setPreview(parsed);
      setError('');
    } catch (e) { setError('Could not parse CSV. Check the format and try again.'); }
  };

  const handleCommit = () => {
    if (!preview) return;
    const cfg = configs[activeTab];
    if (activeTab === 'roster') cfg.commit(preview, setPlayers);
    if (activeTab === 'recruits') cfg.commit(preview, setRecruits);
    if (activeTab === 'staff') cfg.commit(preview, setStaff);
    setSuccess(`${preview.length} ${cfg.label.toLowerCase()} records imported successfully.`);
    setPreview(null);
    setCsvText('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const cfg = configs[activeTab];
  const Icon = cfg.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Data Management</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Import Hub</h1>
          <p className="text-sm text-stone-500 mt-1">Paste CSV text or upload a file · preview before committing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Object.entries(configs).map(([key, c]) => {
          const I = c.icon;
          return (
            <button key={key} onClick={() => { setActiveTab(key); setPreview(null); setCsvText(''); setError(''); setSuccess(''); }} className={`flex items-center gap-2 text-xs tracking-wider uppercase font-semibold px-4 py-2.5 border rounded-sm transition-colors ${activeTab === key ? 'bg-amber-400 text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'}`}>
              <I size={13} />{c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-sm">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} className="text-amber-400" />
              <span className="text-sm font-semibold text-stone-100">Import {cfg.label}</span>
            </div>

            {/* File upload */}
            <div className="border-2 border-dashed border-stone-700 hover:border-amber-400 transition-colors p-6 text-center mb-4 rounded-sm cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Upload size={24} className="text-stone-600 mx-auto mb-2" />
              <div className="text-sm text-stone-400">Drag & drop a CSV or click to browse</div>
              <div className="text-xs text-stone-600 mt-1">Supports .csv files</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={loadFile} className="hidden" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-stone-700" />
              <span className="text-xs text-stone-500">or paste CSV below</span>
              <div className="h-px flex-1 bg-stone-700" />
            </div>

            <textarea
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setPreview(null); setError(''); setSuccess(''); }}
              className={`${inp} font-mono text-xs`}
              rows={8}
              placeholder={`Expected columns:\n${cfg.columns}\n\nExample:\n${cfg.example}`}
            />

            {error && <div className="mt-3 text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-3 py-2 rounded-sm">{error}</div>}
            {success && <div className="mt-3 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-3 py-2 flex items-center gap-2 rounded-sm"><CheckCircle2 size={13} />{success}</div>}

            <div className="flex gap-2 mt-4">
              <button onClick={handlePreview} className={btnP}><FileText size={13} />Preview</button>
              {preview && <button onClick={handleCommit} className="flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold text-white bg-emerald-600 px-4 py-2 hover:bg-emerald-500 rounded-sm"><CheckCircle2 size={13} />Commit {preview.length} records</button>}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div>
          {!preview ? (
            <div className="bg-stone-950 border border-stone-800 p-8 text-center rounded-sm">
              <FileText size={28} className="text-stone-700 mx-auto mb-3" />
              <div className="text-stone-500 text-sm mb-1">Preview will appear here</div>
              <div className="text-stone-700 text-xs">Paste your CSV and click Preview to see parsed records before importing</div>
            </div>
          ) : (
            <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-100">{preview.length} records ready to import</span>
                <span className="text-xs text-stone-500">Review before committing</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-stone-800">
                {preview.slice(0, 50).map((r, i) => (
                  <div key={i} className="px-4 py-2.5 hover:bg-stone-800/40">
                    <div className="text-sm text-stone-100 font-medium">{r.name}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {activeTab === 'roster' && `${r.position} · ${r.year} · ${r.school || 'no school'} · GPA ${r.gpa}`}
                      {activeTab === 'recruits' && `${r.pos} · ${r.club} · ${r.league} · Tier ${r.tier}`}
                      {activeTab === 'staff' && r.role}
                    </div>
                  </div>
                ))}
                {preview.length > 50 && <div className="px-4 py-2 text-xs text-stone-500 italic">…and {preview.length - 50} more</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Format guide */}
      <div className="bg-stone-950 border border-stone-800 p-5 rounded-sm">
        <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400 mb-3">Expected CSV Format · {cfg.label}</div>
        <div className="font-mono text-xs text-stone-500 bg-stone-900 p-3 rounded-sm border border-stone-800 whitespace-pre-wrap">{cfg.columns}</div>
        <div className="mt-3">
          <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-500 mb-1.5">Example</div>
          <div className="font-mono text-xs text-stone-400 bg-stone-900 p-3 rounded-sm border border-stone-800 whitespace-pre-wrap">{cfg.example}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// APP SHELL
// ============================================================
export default function App() {
  const [view, setView] = useState('command');
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [staff,        setStaffSt]       = useState(DEFAULT_STAFF);
  const [tasks,        setTasksSt]        = useState(DEFAULT_TASKS);
  const [players,      setPlayersSt]      = useState(DEFAULT_PLAYERS);
  const [recruits,     setRecruitsSt]     = useState(DEFAULT_RECRUITS);
  const [events,       setEventsSt]       = useState(DEFAULT_EVENTS);
  const [depthChart,   setDepthChartSt]   = useState(DEFAULT_DEPTH_CHART);
  const [scholarships, setScholarshipsSt] = useState(DEFAULT_SCHOLARSHIPS);

  useEffect(() => {
    let sub;
    const apply = async (s) => {
      setSession(s);
      if (s?.user?.email) {
        acl.email = s.user.email.toLowerCase();
        const { data } = await supabase.from('staff_roles').select('role').eq('email', acl.email).maybeSingle();
        acl.role = data?.role || null;
        setRole(acl.role);
      } else { acl.email = null; acl.role = null; setRole(null); }
      setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    sub = supabase.auth.onAuthStateChange((_e, s) => apply(s)).data.subscription;
    return () => sub && sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!role) return;
    (async () => {
      const [s,t,p,r,e,d,sc] = await Promise.all([
        loadStore('pittv3:staff',        DEFAULT_STAFF),
        loadStore('pittv3:tasks',        DEFAULT_TASKS),
        loadStore('pittv3:players',      DEFAULT_PLAYERS),
        loadStore('pittv3:recruits',     DEFAULT_RECRUITS),
        loadStore('pittv3:events',       DEFAULT_EVENTS),
        loadStore('pittv3:depth',        DEFAULT_DEPTH_CHART),
        loadStore('pittv3:scholarships', DEFAULT_SCHOLARSHIPS),
      ]);
      setStaffSt(s); setTasksSt(t); setPlayersSt(p); setRecruitsSt(r);
      setEventsSt(e); setDepthChartSt(d); setScholarshipsSt(sc);
      setLoaded(true);
    })();
  }, [role]);

  useEffect(() => {
    if (!role) return;
    const setters = {
      'pittv3:staff': setStaffSt, 'pittv3:tasks': setTasksSt, 'pittv3:players': setPlayersSt,
      'pittv3:recruits': setRecruitsSt, 'pittv3:events': setEventsSt, 'pittv3:depth': setDepthChartSt,
      'pittv3:scholarships': setScholarshipsSt,
    };
    const channel = supabase.channel('app_data_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, (payload) => {
        const row = payload.new;
        if (row && setters[row.key] && row.value != null) setters[row.key](row.value);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [role]);

  const setStaff       = v => { setStaffSt(v); saveStore('pittv3:staff', v); };
  const setTasks       = v => { setTasksSt(v); saveStore('pittv3:tasks', v); };
  const setPlayers     = v => { const next = typeof v === 'function' ? v(players) : v; setPlayersSt(next); saveStore('pittv3:players', next); };
  const setRecruits    = v => { const next = typeof v === 'function' ? v(recruits) : v; setRecruitsSt(next); saveStore('pittv3:recruits', next); };
  const setEvents      = v => { setEventsSt(v); saveStore('pittv3:events', v); };
  const setDepthChart  = v => { setDepthChartSt(v);    saveStore('pittv3:depth', v); };
  const setScholarships= v => { setScholarshipsSt(v);  saveStore('pittv3:scholarships', v); };

  const navItems = [
    { id: 'command',       label: 'Command',       icon: LayoutDashboard },
    { id: 'accountability',label: 'Accountability', icon: ClipboardList   },
    { id: 'calendar',      label: 'Calendar',       icon: Calendar        },
    { id: 'roster',        label: 'Roster',         icon: Users           },
    { id: 'depth',         label: 'Depth Chart',    icon: Layers          },
    { id: 'scholarships',  label: 'Scholarships',   icon: Award           },
    { id: 'recruiting',    label: 'Recruiting',     icon: Target          },
    { id: 'board',         label: 'Recruiting Board', icon: Layers        },
    { id: 'camp',          label: 'Camp List',        icon: Mail          },
    { id: 'connection',    label: 'Connection',      icon: Mail            },
    { id: 'staff',         label: 'Staff',           icon: Users           },
  ];

  const resetAll = () => {
    if (!confirm('Reset all data to defaults?')) return;
    setStaff(DEFAULT_STAFF); setTasks(DEFAULT_TASKS); setPlayers(DEFAULT_PLAYERS);
    setRecruits(DEFAULT_RECRUITS); setEvents(DEFAULT_EVENTS);
    setDepthChart(DEFAULT_DEPTH_CHART); setScholarships(DEFAULT_SCHOLARSHIPS);
  };

  const me = staff[0];
  const canEdit = role && role !== 'viewer';

  if (!authReady) return <div className="min-h-screen bg-stone-950 grid place-items-center text-sm text-stone-500" style={{ fontFamily: 'ui-sans-serif,system-ui,sans-serif' }}>Loading…</div>;
  if (!session) return <Login />;
  if (!role) return <Login notAuthorized email={session.user.email} />;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" />
      <div className="flex">
        <aside className="w-58 bg-stone-950 border-r border-stone-800/60 min-h-screen flex flex-col sticky top-0" style={{ width: '224px' }}>
          <div className="p-5 border-b border-stone-800/60">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-9 w-9 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: PITT_GOLD }}>
                <span className="font-serif font-black text-xl leading-none" style={{ fontFamily: '"Playfair Display",Georgia,serif', color: PITT_NAVY }}>P</span>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: PITT_GOLD }}>Pittsburgh</div>
                <div className="text-xs font-semibold leading-tight text-stone-200">Women's Soccer</div>
              </div>
            </div>
            <div className="text-[9px] tracking-[0.3em] uppercase mt-2.5 font-bold" style={{ color: PITT_GOLD }}>· Forged in Steel ·</div>
          </div>

          <nav className="flex-1 py-3">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm transition-colors border-l-2 ${active ? 'bg-stone-900 border-l-2' : 'text-stone-500 hover:text-stone-200 hover:bg-stone-900/50 border-transparent'}`} style={active ? { color: PITT_GOLD, borderColor: PITT_GOLD } : {}}>
                  <Icon size={15} />
                  <span className="font-medium">{item.label}</span>
                  {active && <ChevronRight size={13} className="ml-auto" />}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-stone-800/60 space-y-3">
            <button onClick={resetAll} className="w-full text-[10px] tracking-[0.15em] uppercase text-stone-700 hover:text-amber-400 text-left">Reset all data</button>
            {me && (
              <div className="flex items-center gap-2.5">
                <Avatar staff={me} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-200 truncate">{me.name}</div>
                  <div className="text-[10px] text-stone-600 truncate">{me.role}</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-stone-900 border-b border-stone-800/60 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 flex-1 max-w-sm">
              <Search size={13} className="text-stone-600" />
              <input type="text" placeholder="Search…" className="flex-1 text-sm bg-transparent outline-none placeholder-stone-700 text-stone-300" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: loaded ? '#10b981' : '#78716c' }}>● {loaded ? 'Saved' : 'Loading'}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold px-2 py-1 rounded-sm" style={{ color: '#FFB81C', border: '1px solid #44403c' }}>{role}{!canEdit ? ' · view only' : ''}</span>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-500 hover:text-amber-400">Sign out</button>
              <button className="relative p-2 hover:bg-stone-800 rounded-sm">
                <Bell size={15} className="text-stone-500" />
                {tasks.filter(t => t.status !== 'done' && daysUntil(t.due) < 0).length > 0 && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-500 rounded-full" />}
              </button>
            </div>
          </div>

          <div className="px-8 py-8 max-w-[1600px]">
            {!loaded && <div className="text-stone-500 text-sm">Loading workspace…</div>}
            {loaded && view === 'command'        && <CommandView tasks={tasks} recruits={recruits} events={events} staff={staff} scholarships={scholarships} onNav={setView} />}
            {loaded && view === 'accountability' && <AccountabilityView tasks={tasks} setTasks={setTasks} staff={staff} />}
            {loaded && view === 'calendar'       && <CalendarView events={events} setEvents={setEvents} staff={staff} />}
            {loaded && view === 'roster'         && <RosterView players={players} setPlayers={setPlayers} />}
            {loaded && view === 'depth'          && <DepthChartView depthChart={depthChart} setDepthChart={setDepthChart} />}
            {loaded && view === 'scholarships'   && <ScholarshipsView scholarships={scholarships} setScholarships={setScholarships} />}
            {loaded && view === 'recruiting'     && <RecruitingView recruits={recruits} setRecruits={setRecruits} />}
            {loaded && view === 'board'          && <RecruitingBoard recruits={recruits} setRecruits={setRecruits} />}
            {loaded && view === 'camp'           && <CampList />}
            {loaded && view === 'connection'     && <ConnectionView />}
            {loaded && view === 'staff'          && <StaffView staff={staff} setStaff={setStaff} />}
          </div>
        </main>
      </div>
    </div>
  );
}
