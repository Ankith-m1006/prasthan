// Small built-in festival list (Dec 2026 - Apr 2027), used only when neither the Flagsmith `festival_calendar`
// value nor seed/festival-calendar.json is available. `verified` = checked on 25 Nov 2026 against
// officeholidays.com / calendarific.com / drikpanchang.com (lunar dates can still move by a day; Eid depends on the moon).
import type { CalFestival } from './calendar.js';

const tipsNational = ['Book 3-4 weeks ahead: the night before is the busiest.', 'Use only official booking sites; ignore touts at the bus stand.'];

export const SUB_REGIONS: Record<string, string[]> = { // names match seed/festival-calendar.json `regions` where it has them
  Karnataka: ['Old Mysuru', 'North Karnataka', 'Coastal Karnataka', 'Tulu Nadu', 'Kalyana Karnataka'],
  'Tamil Nadu': ['Chennai', 'Madurai', 'Kongu Nadu', 'Cauvery delta', 'Tirunelveli'],
  'Andhra Pradesh': ['Coastal Andhra', 'Rayalaseema', 'Tirupati'],
  Telangana: ['Hyderabad', 'Telangana plateau'],
  Odisha: ['Coastal Odisha', 'Western Odisha'],
  Bihar: ['Patna', 'Mithila', 'Magadh', 'Bhojpur'],
  'West Bengal': ['Kolkata', 'Bengal plains', 'North Bengal'],
  Kerala: ['Malabar', 'Travancore', 'Thrissur', 'Thiruvananthapuram'],
};

type Row = [id: string, name: string, date: string, states: string[], rush: [string, string], line: string, verified: boolean];

const ROWS: Row[] = [
  ['christmas-2026', 'Christmas', '2026-12-25', [], ['2026-12-23', '2026-12-27'], 'Friday, so a long weekend.', true],
  ['newyear-2027', 'New Year', '2027-01-01', [], ['2026-12-30', '2027-01-03'], 'Friday again: two long weekends in a row.', true],
  ['bhogi-2027', 'Bhogi', '2027-01-14', ['Andhra Pradesh', 'Telangana', 'Tamil Nadu'], ['2027-01-12', '2027-01-14'], 'Day before Sankranti and Pongal.', false],
  ['lohri-2027', 'Lohri', '2027-01-14', ['Punjab', 'Haryana'], ['2027-01-12', '2027-01-14'], 'Bonfire night before Maghi.', false],
  ['sankranti-2027', 'Makara Sankranti', '2027-01-15', ['Karnataka', 'Andhra Pradesh', 'Telangana', 'Odisha', 'Bihar'], ['2027-01-12', '2027-01-17'], 'Ellu-bella and kites; the biggest bus rush of the winter.', true],
  ['pongal-2027', 'Thai Pongal', '2027-01-15', ['Tamil Nadu'], ['2027-01-12', '2027-01-18'], 'Four days of Pongal; Chennai and Madurai buses fill first.', true],
  ['magh-bihu-2027', 'Magh Bihu', '2027-01-15', ['Assam'], ['2027-01-13', '2027-01-16'], 'Harvest feast after Uruka night.', false],
  ['republic-day-2027', 'Republic Day', '2027-01-26', [], ['2027-01-22', '2027-01-26'], 'Tuesday: many take Monday off.', true],
  ['shivaratri-2027', 'Maha Shivaratri', '2027-03-06', [], ['2027-03-04', '2027-03-07'], 'Saturday; temple towns get crowded.', true],
  ['eid-ul-fitr-2027', 'Eid al-Fitr', '2027-03-10', [], ['2027-03-08', '2027-03-11'], 'Depends on the moon: 9 or 10 March.', false],
  ['holi-2027', 'Holi', '2027-03-22', ['Bihar', 'Uttar Pradesh', 'West Bengal', 'Odisha'], ['2027-03-19', '2027-03-22'], 'Sources say 21 or 22 March; Patna trains sell out early.', false],
  ['ugadi-2027', 'Ugadi', '2027-04-07', ['Karnataka', 'Andhra Pradesh', 'Telangana'], ['2027-04-05', '2027-04-08'], 'New year for Karnataka, Andhra and Telangana.', true],
  ['puthandu-2027', 'Tamil New Year', '2027-04-14', ['Tamil Nadu'], ['2027-04-12', '2027-04-14'], 'Puthandu, 14 April (Wednesday).', true],
  ['pana-sankranti-2027', 'Pana Sankranti', '2027-04-14', ['Odisha'], ['2027-04-12', '2027-04-14'], 'Odia New Year.', false],
  ['poila-boishakh-2027', 'Poila Boishakh', '2027-04-15', ['West Bengal'], ['2027-04-13', '2027-04-15'], 'Bengali New Year (14 or 15 April).', false],
];

export const FALLBACK_FESTIVALS: CalFestival[] = ROWS.map(([id, name, date, states, rush, line, verified]) => ({
  id, name, date, type: states.length ? 'regional' : 'national', states, rush: { from: rush[0], to: rush[1] }, line,
  tips: states.length ? ['Rush starts 2-3 nights before; book the return too.', tipsNational[1]] : tipsNational, verified,
}));
