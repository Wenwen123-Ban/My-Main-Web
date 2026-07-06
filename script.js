/* Shared utilities for Personal Web */

const DAY_ORDER = { M: 1, T: 2, W: 3, TH: 4, F: 5 };

function getTodayCode() {
    const day = new Date().getDay(); // 0=Sun,1=Mon...
    const map = { 1: 'M', 2: 'T', 3: 'W', 4: 'TH', 5: 'F' };
    return map[day] || null; // null on weekends
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

function minutesToDisplay(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function getSubjects() {
    try {
        const raw = localStorage.getItem('subjects');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        // In case the stored value is an object with `subjects` key
        if (parsed && Array.isArray(parsed.subjects)) return parsed.subjects;
        return [];
    } catch (e) {
        console.warn('getSubjects: failed to parse localStorage', e);
        return [];
    }
}

async function fetchFromJSON() {
    try {
        const res = await fetch('subjects.json', { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.subjects || [];
    } catch (e) {
        console.warn('fetchFromJSON failed', e);
        return [];
    }
}

// Utility to load from localStorage first, otherwise from subjects.json
async function loadSubjectsPreferLocal() {
    const local = getSubjects();
    if (local && local.length) return local;
    const remote = await fetchFromJSON();
    return remote;
}
