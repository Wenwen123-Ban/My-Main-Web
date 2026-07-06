# ═══════════════════════════════════════════════════════════════
# Personal Web — Build Guide
# Host: GitHub Pages (static)
# First Feature: Subject Scheduler
# Philosophy: Low on design. High on service quality.
# ═══════════════════════════════════════════════════════════════

## What This Project Is

A personal static website hosted on GitHub Pages.
Single developer (you). Manually updated via git commit.
No backend. No database. No login system.
All data stored in a JSON file committed to the repo.

---

## Design Philosophy

```
Low on design means:
  → Clean readable layout — not minimal to the point of ugly
  → No heavy animations or visual tricks
  → Fast load — plain HTML/CSS/JS, no frameworks
  → Works on mobile without extra effort
  → Typography and spacing do the heavy lifting

High on service quality means:
  → Features actually work reliably
  → Data persists correctly
  → Time sorting is always accurate
  → Day detection is always correct
  → Adding a subject takes under 30 seconds
```

---

## File Structure

```
the-repo/Web/           ← A folder 
├── index.html          ← Main page (Home + nav)
├── subj.html           ← Subject list, add, manage
├── subjects.json       ← All subject data (committed to repo)
├── style.css           ← Shared styles for both pages
├── script.js           ← Shared JS logic for both pages
└── README.md           ← This file
```

Both pages share the same CSS and JS file.
No page needs a separate stylesheet or script.

---

## How Storage Works on GitHub Pages

GitHub Pages is static — it serves files, it cannot write them.
This means a subject you add in the browser cannot automatically
save back to the repo. Here is the exact flow:

```
READING subjects (automatic, always works):
  Browser loads subj.html
  JS does: fetch('subjects.json')
  Gets the list → renders it on screen
  Works perfectly on GitHub Pages

WRITING subjects (your manual update flow):
  You fill the Add Subject form
  JS saves to localStorage (browser memory — instant)
  JS shows a "⬇ Download Updated JSON" button
  You click it → subjects.json downloads to your PC
  You replace the old subjects.json in your repo with it
  git add subjects.json
  git commit -m "update: added [subject name]"
  git push origin main
  GitHub Pages serves the new JSON within 1-2 minutes

Why localStorage too:
  → Your changes appear instantly without waiting for commit
  → The site works offline from your own browser
  → localStorage is the live working copy
  → subjects.json in the repo is the permanent saved copy
```

---

## Subject Data Structure — subjects.json

```json
{
    "last_updated": "2026-07-06",
    "semester":     "1st Semester 2026-2027",
    "subjects": [
        {
            "id":          "1720000001",
            "code":        "CC101",
            "description": "Introduction to Computing",
            "day":         "M",
            "time_start":  "07:00",
            "time_end":    "08:00",
            "room":        "Room 101",
            "instructor":  "Prof. Santos",
            "units":       3
        },
        {
            "id":          "1720000002",
            "code":        "CC102",
            "description": "Computer Programming 1",
            "day":         "T",
            "time_start":  "08:00",
            "time_end":    "09:30",
            "room":        "Lab 2",
            "instructor":  "Prof. Reyes",
            "units":       3
        }
    ]
}
```

Field breakdown:
```
id           → timestamp string — unique per subject, used for delete
code         → subject code (CC101, BSIT201, etc.)
description  → full subject name
day          → M | T | W | TH | F
time_start   → 24-hour format string "07:00"
time_end     → 24-hour format string "08:00"
room         → room or lab name
instructor   → professor name
units        → number of units
```

---

## Day and Time Sorting Logic

### Day Sort Order
```javascript
const DAY_ORDER = { M: 1, T: 2, W: 3, TH: 4, F: 5 };

// Sort subjects by day then by time_start
subjects.sort((a, b) => {
    const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
    if (dayDiff !== 0) return dayDiff;
    // Same day — sort by time
    return timeToMinutes(a.time_start) - timeToMinutes(b.time_start);
});
```

### Time to Minutes Conversion
```javascript
function timeToMinutes(timeStr) {
    // "07:00" → 420 minutes from midnight
    // "13:30" → 810 minutes from midnight
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Display back as readable time
function minutesToDisplay(timeStr) {
    // "07:00" → "7:00 AM"
    // "13:30" → "1:30 PM"
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour   = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}
```

### Today's Day Detection
```javascript
function getTodayCode() {
    // Returns M | T | W | TH | F | null (weekend)
    const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const map  = { 1:'M', 2:'T', 3:'W', 4:'TH', 5:'F' };
    return map[day] || null;   // null on weekends
}
```

---

---

# ─────────────────────────────────────────────
# PAGE 1 — index.html (Home)
# ─────────────────────────────────────────────

## What Home Shows

```
┌──────────────────────────────────────────────────┐
│  Welcome to the Main Page                        │
│  Multi Purpose Project                           │
│  7/6/2026, 7:31:06 PM          ← live clock     │
├──────────────────────────────────────────────────┤
│  Home  Introducing  Projects  About  [Dropdown▼] │
├──────────────────────────────────────────────────┤
│                                                  │
│  TODAY — Monday, July 6                          │
│  Your subjects today:                            │
│                                                  │
│  7:00 AM – 8:00 AM    CC101  Intro to Computing  │
│  8:00 AM – 9:30 AM    CC102  Computer Prog 1     │
│  1:00 PM – 2:30 PM    CC103  Data Structures     │
│                                                  │
│  No more subjects after 2:30 PM today.           │
│                                                  │
│  ── Introduction ─────────────────────────────── │
│  Welcome to my document project...               │
│                                                  │
│  ── Features ─────────────────────────────────── │
│  Here is what this project can do...             │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Today's Subjects Logic

```javascript
// On page load — index.html only
async function loadTodaySubjects() {
    const todayCode = getTodayCode();
    const container = document.getElementById('today-subjects');

    // Weekend handling
    if (!todayCode) {
        container.innerHTML = '<p>No classes today — it\'s the weekend.</p>';
        return;
    }

    // Load from localStorage first, fall back to subjects.json
    let subjects = loadFromStorage();
    if (!subjects.length) {
        subjects = await fetchFromJSON();
    }

    // Filter to today only
    const todaySubjects = subjects
        .filter(s => s.day === todayCode)
        .sort((a, b) => timeToMinutes(a.time_start) - timeToMinutes(b.time_start));

    if (!todaySubjects.length) {
        container.innerHTML = '<p>No subjects registered for today.</p>';
        return;
    }

    // Render the list
    container.innerHTML = todaySubjects.map(s => `
        <div class="subject-row">
            <span class="time">
                ${minutesToDisplay(s.time_start)} – ${minutesToDisplay(s.time_end)}
            </span>
            <span class="code">${s.code}</span>
            <span class="desc">${s.description}</span>
        </div>
    `).join('');
}
```

## Dropdown Menu — Links

```html
<!-- Dropdown content -->
<div class="dropdown-content">
    <a href="subj.html">Subject List & Registration</a>
    <hr>
    <a href="https://YOUR_USERNAME.github.io/nexus" target="_blank">
        NEXUS — Homelab Control Panel ↗
    </a>
</div>
```

The NEXUS link opens in a new tab (`target="_blank"`).
Add the same link to the About section and footer of the page.

---

---

# ─────────────────────────────────────────────
# PAGE 2 — subj.html (Subject Manager)
# ─────────────────────────────────────────────

## What subj.html Shows

```
┌──────────────────────────────────────────────────────────────┐
│  Subject List & Registration                                 │
├──────────────────────────────────────────────────────────────┤
│  Home  Introducing  Projects  About  [Dropdown▼]             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [+ Add Subject]   [⬇ Download JSON]   [⬆ Import JSON]      │
│                                                              │
│  Filter: [All ▼]   Sort by: [Day + Time ▼]                  │
│                                                              │
│  ── MONDAY ─────────────────────────────────────────────     │
│  7:00–8:00 AM     CC101   Intro to Computing    Room 101  [✕]│
│  8:00–9:30 AM     CC102   Computer Prog 1       Lab 2     [✕]│
│                                                              │
│  ── TUESDAY ────────────────────────────────────────────     │
│  9:00–10:30 AM    CC103   Data Structures       Room 203  [✕]│
│                                                              │
│  ── WEDNESDAY ──────────────────────────────────────────     │
│  (no subjects)                                              │
│                                                              │
│  [+ Add Subject] ← button repeated at bottom                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Add Subject Form

```
┌──────────────────────────────────────────────────────────────┐
│  Add New Subject                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Subject Code    [CC101          ]                           │
│  Description     [Intro to Computing                    ]    │
│  Day             [Monday ▼]                                  │
│  Time Start      [07:00]  (24hr or use AM/PM selector)       │
│  Time End        [08:00]                                     │
│  Room            [Room 101       ]                           │
│  Instructor      [Prof. Santos   ]                           │
│  Units           [3]                                         │
│                                                              │
│  [Save Subject]    [Cancel]                                  │
│                                                              │
│  ⚠ Remember to download and commit subjects.json            │
│    to save permanently to GitHub.                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## subj.html JavaScript Behavior

### Load on page open
```javascript
// Priority order:
// 1. Load from localStorage (your live working copy)
// 2. If localStorage is empty, fetch subjects.json from repo
// 3. Merge and deduplicate by id if both have entries
// 4. Sort all by day then time
// 5. Render grouped by day (M, T, W, TH, F)
```

### Save subject
```javascript
function saveSubject(formData) {
    const subject = {
        id:          Date.now().toString(),
        code:        formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        day:         formData.day,       // M | T | W | TH | F
        time_start:  formData.timeStart, // "07:00"
        time_end:    formData.timeEnd,   // "08:00"
        room:        formData.room.trim(),
        instructor:  formData.instructor.trim(),
        units:       parseInt(formData.units)
    };

    // Validation before saving
    if (!subject.code || !subject.description) {
        showError("Code and description are required.");
        return;
    }
    if (timeToMinutes(subject.time_end) <= timeToMinutes(subject.time_start)) {
        showError("End time must be after start time.");
        return;
    }

    // Check for time conflict on same day
    const conflict = getSubjects().find(s =>
        s.day === subject.day &&
        timeToMinutes(s.time_start) < timeToMinutes(subject.time_end) &&
        timeToMinutes(s.time_end) > timeToMinutes(subject.time_start)
    );
    if (conflict) {
        showError(`Time conflict with: ${conflict.code} (${conflict.time_start}–${conflict.time_end})`);
        return;
    }

    // Save to localStorage
    const subjects = getSubjects();
    subjects.push(subject);
    localStorage.setItem('subjects', JSON.stringify(subjects));

    // Re-render and show download reminder
    renderSubjects();
    showDownloadReminder();
}
```

### Delete subject
```javascript
function deleteSubject(id) {
    const confirmed = confirm("Remove this subject?");
    if (!confirmed) return;

    const subjects = getSubjects().filter(s => s.id !== id);
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjects();
    showDownloadReminder();
}
```

### Download JSON (commit workflow)
```javascript
function downloadJSON() {
    const subjects = getSubjects();
    const data = {
        last_updated: new Date().toISOString().split('T')[0],
        semester:     "1st Semester 2026-2027",
        subjects:     subjects
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 4)],
        { type: 'application/json' }
    );
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'subjects.json';
    a.click();
    URL.revokeObjectURL(url);
}
```

### Import JSON (load from committed file)
```javascript
function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            localStorage.setItem('subjects', JSON.stringify(data.subjects));
            renderSubjects();
            alert(`Imported ${data.subjects.length} subjects.`);
        } catch (err) {
            alert("Invalid JSON file.");
        }
    };
    reader.readAsText(file);
}
```

---

---

# ─────────────────────────────────────────────
# SHARED — style.css
# ─────────────────────────────────────────────

## CSS Variables (your current color scheme extended)

```css
:root {
    /* Current colors from your screenshot */
    --color-title:    #2a7a2a;   /* dark green — "Welcome to the Main Page" */
    --color-subtitle: #8b3a3a;   /* dark red — "Multi Purpose Project" */
    --color-nav-bg:   #2c2c2c;   /* dark nav bar */
    --color-nav-text: #ffffff;
    --color-btn:      #2a7a2a;   /* green dropdown button */

    /* Added for subject scheduler */
    --color-day-header: #2c2c2c;
    --color-row-hover:  #f5f5f5;
    --color-time:       #555555;
    --color-code:       #2a7a2a;
    --color-conflict:   #cc0000;
    --color-warning:    #cc7700;

    --font-main: Georgia, serif;
    --font-ui:   'Segoe UI', system-ui, sans-serif;
}
```

---

# ─────────────────────────────────────────────
# SHARED — script.js
# ─────────────────────────────────────────────

## Functions That Go in script.js

```
Function                Used by          Purpose
──────────────────────  ───────────────  ──────────────────────────────
getTodayCode()          index + subj     Detect current weekday as M/T/W/TH/F
timeToMinutes()         index + subj     Convert "07:00" to 420 for sorting
minutesToDisplay()      index + subj     Convert "07:00" to "7:00 AM"
getSubjects()           index + subj     Read from localStorage
fetchFromJSON()         index + subj     Fetch subjects.json from repo
saveSubject()           subj only        Save new subject to localStorage
deleteSubject()         subj only        Remove subject by id
renderSubjects()        subj only        Build the full grouped list HTML
downloadJSON()          subj only        Generate and download subjects.json
importJSON()            subj only        Load from uploaded subjects.json file
showDownloadReminder()  subj only        Remind user to commit the JSON
updateClock()           index only       Live clock in header
loadTodaySubjects()     index only       Filter + render today's subjects
```

---

# ─────────────────────────────────────────────
# NEXUS LINK INTEGRATION
# ─────────────────────────────────────────────

## Where to Link NEXUS on the Personal Site

```
Location                Element                  Text
──────────────────────  ──────────────────────   ──────────────────────────────
Nav dropdown            Dropdown menu item        "NEXUS — Homelab Panel ↗"
About section           Paragraph + button        "Check out my other project"
Footer                  Footer link              "NEXUS Project →"
```

## NEXUS Link HTML (reuse on both pages)
```html
<a
    href="https://YOUR_USERNAME.github.io/nexus"
    target="_blank"
    rel="noopener noreferrer"
    class="nexus-link"
>
    NEXUS — Personal Homelab Control Panel ↗
</a>
```

---

# ─────────────────────────────────────────────
# GIT WORKFLOW — How to Update the Site
# ─────────────────────────────────────────────

## For Subject Changes (most common update)

```bash
# 1. Open your site in browser
# 2. Go to subj.html
# 3. Add or delete subjects using the form
# 4. Click "⬇ Download JSON"
# 5. Replace subjects.json in your repo folder with the download
# 6. In VS Code terminal:

git add subjects.json
git commit -m "update: add [subject name] on [day]"
git push origin main

# GitHub Pages updates within 1-2 minutes
```

## For Page Content Changes

```bash
# Edit index.html or subj.html directly in VS Code
git add index.html subj.html
git commit -m "update: [what changed]"
git push origin main
```

## For Style Changes

```bash
git add style.css
git commit -m "style: [what changed]"
git push origin main
```

---

# ─────────────────────────────────────────────
# BUILD ORDER
# ─────────────────────────────────────────────

```
Step 1 — subjects.json
  Create the empty JSON file with correct structure
  Add 2-3 sample subjects to test with
  Commit to repo

Step 2 — script.js shared functions
  getTodayCode()
  timeToMinutes()
  minutesToDisplay()
  getSubjects()
  fetchFromJSON()

Step 3 — index.html Today's Subjects section
  loadTodaySubjects() function
  Render today's filtered and sorted subjects
  Weekend message handling
  Test: open on a Monday → see Monday subjects only

Step 4 — subj.html Subject List
  renderSubjects() — grouped by day with day headers
  Sorted by day → time within each day
  Delete button per subject

Step 5 — subj.html Add Form
  Form fields (code, description, day, time, room, instructor)
  saveSubject() with validation
  Time conflict detection
  Success message after save

Step 6 — Download/Import JSON
  downloadJSON() button
  importJSON() file picker
  showDownloadReminder() after any change

Step 7 — Nav and Dropdown
  Dropdown with subject list link
  NEXUS site link in dropdown
  Same nav on both pages

Step 8 — NEXUS link integration
  Add NEXUS links in About section and footer
  Test link opens nexus github pages correctly

Step 9 — Polish and deploy
  Test on mobile browser
  Check all sorting is correct
  Commit everything
  Enable GitHub Pages (or already enabled from NEXUS site)
  Confirm live URL works
```

---

# ─────────────────────────────────────────────
# TESTING PLAN
# ─────────────────────────────────────────────

```
TEST 1 — Day detection
  Open index.html on a Monday → should show Monday subjects
  Open on a Saturday → should show "No classes — weekend"

TEST 2 — Time sorting
  Add subject at 9:00 AM before adding 7:00 AM subject
  Confirm list shows 7:00 AM first automatically

TEST 3 — Day grouping on subj.html
  Add subjects on different days
  Confirm they group under correct day headers
  Monday group before Tuesday group etc.

TEST 4 — Conflict detection
  Add CC101 at 7:00–8:00 AM Monday
  Try adding CC102 at 7:30–8:30 AM Monday
  Confirm error: "Time conflict with CC101"

TEST 5 — Download and reimport
  Add 3 subjects
  Download subjects.json
  Clear localStorage (DevTools → Application → Clear)
  Reload page → should show nothing (storage cleared)
  Use Import JSON → upload the downloaded file
  Confirm all 3 subjects reappear

TEST 6 — GitHub Pages live test
  Commit subjects.json with sample data
  Visit live GitHub Pages URL
  Confirm subjects load from the committed JSON

TEST 7 — NEXUS link
  Click NEXUS link in dropdown
  Confirm nexus GitHub Pages site opens in new tab
```

---

# ─────────────────────────────────────────────
# CHECKLIST
# ─────────────────────────────────────────────

```
subjects.json:
  - [ ] File created with correct structure
  - [ ] At least 2 sample subjects added for testing
  - [ ] Committed to repo

script.js shared:
  - [ ] getTodayCode() returns correct day code
  - [ ] timeToMinutes() converts correctly
  - [ ] minutesToDisplay() shows AM/PM format
  - [ ] getSubjects() reads localStorage
  - [ ] fetchFromJSON() loads from subjects.json

index.html:
  - [ ] Today's subjects section renders correctly
  - [ ] Subjects filtered to current day only
  - [ ] Sorted by time_start ascending
  - [ ] Weekend message shows on Saturday/Sunday
  - [ ] Clock updates live every second
  - [ ] NEXUS link in dropdown works

subj.html:
  - [ ] All subjects listed grouped by day
  - [ ] Each day group has a header (── MONDAY ──)
  - [ ] Subjects within each day sorted by time
  - [ ] Add form has all required fields
  - [ ] Validation catches empty code/description
  - [ ] End time before start time is rejected
  - [ ] Time conflict is detected and shown
  - [ ] Delete removes subject immediately
  - [ ] Download JSON produces valid file
  - [ ] Import JSON loads subjects correctly
  - [ ] Download reminder shown after every change

Deployment:
  - [ ] GitHub Pages enabled for this repo
  - [ ] Live URL confirmed working
  - [ ] subjects.json loads on live URL
  - [ ] NEXUS link opens correctly from live site
```

---

# Future Features (After Subject Scheduler)

```
Feature              Description
──────────────────   ──────────────────────────────────────────
Grade tracker        Input grades per subject, compute GWA
Weekly view          Calendar-style grid of the week's schedule
Exam scheduler       Separate list of upcoming exams with dates
Notes per subject    Quick note field per subject entry
Print schedule       Browser print-friendly version of weekly view
Dark mode toggle     CSS variable swap — single button
About Me page        Portfolio-style introduction
Projects page        List NEXUS and other GitHub projects
```

---

*Personal Web — Build Guide*
*Subject Scheduler v1.0*
*Storage: localStorage + subjects.json via git commit*
*Host: GitHub Pages — static, free, permanently yours*
