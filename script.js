/* Shared utilities for Personal Web */

const DAY_ORDER = { M: 1, T: 2, W: 3, TH: 4, F: 5 };

function getTodayCode() {
    const day = new Date().getDay(); // 0=Sun,1=Mon...
    const map = { 1: 'M', 2: 'T', 3: 'W', 4: 'TH', 5: 'F' };
    return map[day] || null; // null on weekends
}

function parseTimeString(timeStr, isAMFlag) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const normalized = timeStr.trim().toUpperCase();
    const ampmMatch = normalized.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)$/);
    if (ampmMatch) {
        let hours = Number(ampmMatch[1]);
        const minutes = Number(ampmMatch[2] || '0');
        const period = ampmMatch[3];
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return { hours, minutes };
    }

    const twentyFourMatch = normalized.match(/^(\d{1,2})(?::(\d{1,2}))$/);
    if (twentyFourMatch) {
        let hours = Number(twentyFourMatch[1]);
        const minutes = Number(twentyFourMatch[2] || '0');
        if (hours >= 0 && hours <= 23) {
            if (isAMFlag === true) {
                if (hours === 12) hours = 0;
            } else if (isAMFlag === false) {
                if (hours < 12) hours += 12;
            } else if (hours >= 1 && hours <= 6) {
                hours += 12;
            }
            return { hours, minutes };
        }
    }

    return null;
}

function timeToMinutes(timeStr, isAMFlag) {
    const parsed = parseTimeString(timeStr, isAMFlag);
    if (!parsed) return 0;
    return parsed.hours * 60 + parsed.minutes;
}

function minutesToDisplay(timeStr, isAMFlag) {
    const parsed = parseTimeString(timeStr, isAMFlag);
    if (!parsed) return timeStr || '';
    const period = parsed.hours >= 12 ? 'PM' : 'AM';
    const hour = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12;
    return `${hour}:${String(parsed.minutes).padStart(2, '0')} ${period}`;
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

// Fetch the full JSON file (subjects + metadata)
async function fetchSubjectsData() {
    try {
        const res = await fetch('subjects.json', { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return data;
    } catch (e) {
        console.warn('fetchSubjectsData failed', e);
        return null;
    }
}

function getActiveSemesterGroup(data) {
    if (!data) return null;
    if (Array.isArray(data.semester_groups)) {
        const exactActive = data.semester_groups.find(g => g.active);
        if (exactActive) return exactActive;
        const visibleGroup = data.semester_groups.find(g => g.show_groups || g.show_index_feature);
        return visibleGroup || data.semester_groups[0] || null;
    }
    return data;
}

function getVisibleSemesterGroups(data) {
    if (!data) return [];
    if (Array.isArray(data.semester_groups)) {
        return data.semester_groups.filter(g => g.show_groups || g.show_index_feature);
    }
    return [data];
}

// Utility to load from localStorage first, otherwise from subjects.json
async function loadSubjectsPreferLocal() {
    const local = getSubjects();
    if (local && local.length) return local;
    const remote = await fetchFromJSON();
    return remote;
}
