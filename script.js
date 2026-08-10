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
        return flattenSubjectGroups(data);
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

function isActiveSemesterGroup(group) {
    return Boolean(group && group.active === true);
}

function getActiveSemesterGroup(data) {
    if (!data) return null;
    if (Array.isArray(data.semester_groups)) {
        return data.semester_groups.find(isActiveSemesterGroup) || null;
    }
    return isActiveSemesterGroup(data) ? data : null;
}

function getVisibleSemesterGroups(data) {
    if (!data) return [];
    if (Array.isArray(data.semester_groups)) {
        return data.semester_groups.filter(isActiveSemesterGroup);
    }
    return isActiveSemesterGroup(data) ? [data] : [];
}

// Utility to load from localStorage first, otherwise from subjects.json
async function loadSubjectsPreferLocal() {
    const local = getSubjects();
    if (local && local.length) return local;
    const remote = await fetchFromJSON();
    return remote;
}

const DAY_LABELS = { M: 'Monday', T: 'Tuesday', W: 'Wednesday', TH: 'Thursday', F: 'Friday', S: 'Saturday', SU: 'Sunday' };
const FULL_DAY_ORDER = { M: 1, T: 2, W: 3, TH: 4, F: 5, S: 6, SU: 7 };
const SCHEMA_DAY_CODES = Object.freeze(Object.keys(DAY_LABELS));
const VALID_DAY_CODES = new Set(SCHEMA_DAY_CODES);

function normalizeDayCode(day) {
    if (typeof day !== 'string') return '';
    const normalized = day.trim().toUpperCase();
    return VALID_DAY_CODES.has(normalized) ? normalized : '';
}

function normalizeSubject(subject, group) {
    const day = normalizeDayCode(subject.day);
    return {
        ...subject,
        day,
        semester: group?.semester || 'Unassigned semester',
        activeSemester: Boolean(group?.active),
        dayLabel: DAY_LABELS[day] || 'Unscheduled',
        startMinutes: timeToMinutes(subject.time_start, subject.time_start_is_am),
        endMinutes: timeToMinutes(subject.time_end, subject.time_end_is_am)
    };
}

function flattenSubjectGroups(data, options = {}) {
    const groups = Array.isArray(data?.semester_groups) ? data.semester_groups : (data ? [data] : []);
    const includeInactive = options.includeInactive === true;
    return groups
        .filter(group => includeInactive || isActiveSemesterGroup(group))
        .flatMap(group => (Array.isArray(group.subjects) ? group.subjects : []).map(subject => normalizeSubject(subject, group)));
}

function compareSubjects(a, b, sortBy = 'day-time') {
    const codeCompare = String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true });
    const titleCompare = String(a.description || '').localeCompare(String(b.description || ''), undefined, { numeric: true });

    if (sortBy === 'code') return codeCompare || titleCompare;
    if (sortBy === 'title') return titleCompare || codeCompare;
    if (sortBy === 'units') return (Number(b.units || 0) - Number(a.units || 0)) || codeCompare;
    if (sortBy === 'semester') return String(a.semester).localeCompare(String(b.semester)) || codeCompare;

    return (FULL_DAY_ORDER[a.day] || 99) - (FULL_DAY_ORDER[b.day] || 99)
        || a.startMinutes - b.startMinutes
        || codeCompare;
}

function uniqueValues(items, key) {
    return [...new Set(items.map(item => item[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

const MOBILE_VIEW_KEY = 'siteMobileView';
const LEGACY_MOBILE_VIEW_KEY = 'homeMobileView';

const MOBILE_FOOTER_NAV_ITEMS = Object.freeze([
    { href: 'index.html', icon: '🏠', label: 'Home' },
    { href: 'subj.html', icon: '📚', label: 'Subjects' },
    { href: 'calcugrade.html', icon: '🧮', label: 'Grades' },
    { href: 'download.html', icon: '📂', label: 'Projects' }
]);

function injectMobileViewStyles() {
    if (document.getElementById('site-mobile-view-styles')) return;
    const style = document.createElement('style');
    style.id = 'site-mobile-view-styles';
    style.textContent = `
        .mobile-footer-nav { display: none; }
        body.mobile-view { padding-bottom: 96px; }
        body.mobile-view .mobile-footer-nav {
            position: fixed;
            left: 50%;
            bottom: max(12px, env(safe-area-inset-bottom));
            transform: translateX(-50%);
            width: min(440px, calc(100vw - 24px));
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            padding: 10px;
            border: 1px solid rgba(219, 231, 243, .95);
            border-radius: 26px;
            background: rgba(15, 23, 42, .92);
            box-shadow: 0 22px 48px rgba(15, 23, 42, .28);
            backdrop-filter: blur(18px);
            z-index: 5000;
        }
        body.mobile-view .mobile-footer-nav a {
            min-width: 0;
            display: grid;
            justify-items: center;
            gap: 3px;
            padding: 9px 4px;
            border-radius: 18px;
            color: rgba(255, 255, 255, .78);
            text-decoration: none;
            font: 800 11px/1.1 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        }
        body.mobile-view .mobile-footer-nav a[aria-current="page"] {
            color: #ffffff;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            box-shadow: 0 10px 22px rgba(20, 184, 166, .24);
        }
        body.mobile-view .mobile-footer-nav .mobile-footer-icon { font-size: 1.35rem; line-height: 1; }
        body.mobile-view .mobile-footer-nav .mobile-footer-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        body.mobile-view .nav-panel ul,
        body.mobile-view > nav:not(.mobile-footer-nav) ul { display: none !important; }
        body.mobile-view .nav-panel,
        body.mobile-view > nav:not(.mobile-footer-nav) {
            position: sticky;
            top: 8px;
            display: flex;
            justify-content: flex-end;
            margin: 10px;
            padding: 8px;
            border-radius: 22px;
            z-index: 4000;
        }
        body.mobile-view .nav-panel .dropdown,
        body.mobile-view > nav:not(.mobile-footer-nav) .dropdown { width: min(100%, 240px); margin-left: auto; }
        body.mobile-view .nav-panel .dropbtn,
        body.mobile-view > nav:not(.mobile-footer-nav) .dropbtn { width: 100%; }
    `;
    document.head.appendChild(style);
}

function getCurrentPageName() {
    const page = window.location.pathname.split('/').pop();
    return page || 'index.html';
}

function ensureMobileFooterNav() {
    let footerNav = document.querySelector('.mobile-footer-nav');
    if (!footerNav) {
        footerNav = document.createElement('nav');
        footerNav.className = 'mobile-footer-nav';
        footerNav.setAttribute('aria-label', 'Mobile footer navigation');
        document.body.appendChild(footerNav);
    }

    const currentPage = getCurrentPageName();
    footerNav.innerHTML = MOBILE_FOOTER_NAV_ITEMS.map(item => {
        const active = currentPage === item.href ? ' aria-current="page"' : '';
        return `<a href="${item.href}"${active}><span class="mobile-footer-icon" aria-hidden="true">${item.icon}</span><span class="mobile-footer-label">${item.label}</span></a>`;
    }).join('');
}

function removeMobileFooterNav() {
    document.querySelector('.mobile-footer-nav')?.remove();
}

function isMobileViewEnabled() {
    const current = localStorage.getItem(MOBILE_VIEW_KEY);
    if (current !== null) return current === 'true';
    return localStorage.getItem(LEGACY_MOBILE_VIEW_KEY) === 'true';
}

function applyGlobalMobileViewPreference(enabled) {
    injectMobileViewStyles();
    document.body.classList.toggle('mobile-view', enabled);
    if (enabled) {
        ensureMobileFooterNav();
    } else {
        removeMobileFooterNav();
    }
    document.querySelectorAll('[data-mobile-view-toggle]').forEach(toggle => {
        toggle.textContent = enabled ? '📱 Switch to regular view' : '📱 Switch to mobile view';
        toggle.setAttribute('aria-pressed', String(enabled));
    });
}

function setGlobalMobileViewPreference(enabled) {
    localStorage.setItem(MOBILE_VIEW_KEY, String(enabled));
    localStorage.setItem(LEGACY_MOBILE_VIEW_KEY, String(enabled));
    applyGlobalMobileViewPreference(enabled);
}

function initGlobalMobileViewControls() {
    applyGlobalMobileViewPreference(isMobileViewEnabled());
    document.querySelectorAll('[data-mobile-view-toggle]').forEach(toggle => {
        toggle.addEventListener('click', () => {
            setGlobalMobileViewPreference(!document.body.classList.contains('mobile-view'));
        });
    });
}

document.addEventListener('DOMContentLoaded', initGlobalMobileViewControls);
