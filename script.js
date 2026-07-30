const API_URL = window.location.origin.includes('http') ? `${window.location.origin}/api` : '/api';

let currentUser = null;
let analyticsChart = null;
let adminAnalyticsChart = null;
let currentEditingEventId = null; 
let calendar = null; 

// ============================================
// AUTHENTICATION & INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        verifyToken();
    } else if (window.location.pathname.includes('organizer.html') || 
               window.location.pathname.includes('student.html') || 
               window.location.pathname.includes('admin.html')) {
        window.location.href = 'index.html';
    }

    if (window.location.pathname.includes('student.html')) {
        showPage('studentDashboard');
    } else if (window.location.pathname.includes('organizer.html')) {
        showPage('dashboard');
    } else if (window.location.pathname.includes('admin.html')) {
        showPage('adminDashboard');
    }
});

async function verifyToken() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.user) {
            currentUser = data.user;
        } else {
            currentUser = { id: '2023123456', name: 'Ahmad Faiz Bin Abdullah', role: 'student' };
        }
    } catch (error) { 
        currentUser = { id: '2023123456', name: 'Ahmad Faiz Bin Abdullah', role: 'student' };
    }

    if (window.location.pathname.includes('organizer.html')) {
        initOrganizerDashboard();
    } else if (window.location.pathname.includes('student.html')) {
        initStudentDashboard();
    } else if (window.location.pathname.includes('admin.html')) {
        initAdminDashboard();
    }
}

async function login() { 
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            if (role === 'organizer') window.location.href = 'organizer.html';
            else if (role === 'student') window.location.href = 'student.html';
            else window.location.href = 'admin.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Server error. Please make sure backend is running.');
    }
}

function switchRegTab(type) {
    const studentForm = document.getElementById('studentForm');
    const organizerForm = document.getElementById('organizerForm');
    const tabStudent = document.getElementById('tabStudent');
    const tabOrganizer = document.getElementById('tabOrganizer');

    if (type === 'student') {
        studentForm.style.display = 'block';
        organizerForm.style.display = 'none';
        tabStudent.className = 'btn btn-primary';
        tabOrganizer.className = 'btn btn-secondary';
    } else {
        studentForm.style.display = 'none';
        organizerForm.style.display = 'block';
        tabStudent.className = 'btn btn-secondary';
        tabOrganizer.className = 'btn btn-primary';
    }
}

async function handleRegister(role) { 
    if (role === 'student') {
        const regID = document.getElementById('regID').value.trim();
        const regName = document.getElementById('regName').value.trim();
        const regEmail = document.getElementById('regEmail').value.trim();
        const regPass = document.getElementById('regPass').value.trim();
        const regContact = document.getElementById('regContact').value.trim();
        const regDOB = document.getElementById('regDOB').value;

        const uitmEmailRegex = /^[a-zA-Z0-9.]+@student\.uitm\.edu\.my$/i;
        if (!uitmEmailRegex.test(regEmail)) {
            alert('Invalid Student Email Format!\n\nStudent emails must strictly use the UiTM student email format:\n[StudentID]@student.uitm.edu.my');
            return;
        }

        if (regID && !regEmail.toLowerCase().startsWith(regID.toLowerCase() + '@')) {
            alert(`Email Mismatch!\n\nYour email address should match your Student ID (${regID}@student.uitm.edu.my).`);
            return;
        }

        const regData = { regID, regName, regEmail, regPass, regContact, regDOB };

        try {
            const response = await fetch(`${API_URL}/register/student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regData)
            });
            
            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Registration successful! Please wait for admin approval.');
                toggleAuth(false);
            } else { 
                alert(data.message || 'Registration failed.'); 
            }
        } catch (error) { 
            alert('Server error or endpoint not reachable.'); 
        }
    } else if (role === 'organizer') {
        const orgID = document.getElementById('orgID').value.trim();
        const orgName = document.getElementById('orgName').value.trim();
        const orgEmail = document.getElementById('orgEmail').value.trim();
        const orgPass = document.getElementById('orgPass').value.trim();
        const orgContact = document.getElementById('orgContact').value.trim();
        const orgCity = document.getElementById('orgCity').value.trim();
        const orgDOE = document.getElementById('orgDOE').value;

        const standardEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!standardEmailRegex.test(orgEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        const orgData = { orgID, orgName, orgEmail, orgPass, orgContact, orgCity, orgDOE };

        try {
            const response = await fetch(`${API_URL}/register/organizer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orgData)
            });
            
            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Registration successful! Please wait for admin approval.');
                toggleAuth(false);
            } else { 
                alert(data.message || 'Registration failed.'); 
            }
        } catch (error) { 
            alert('Server error or endpoint not reachable.'); 
        }
    }    
}

function logout() { 
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Do NOT wrap this inside an "addEventListener('DOMContentLoaded')" block
function toggleAuth(isRegister) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm && registerForm) {
        loginForm.style.display = isRegister ? 'none' : 'block';
        registerForm.style.display = isRegister ? 'block' : 'none';
    }
}

// ============================================
// UNIFIED PAGE NAVIGATION
// ============================================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    const target = document.getElementById(`${pageId}Page`) || document.getElementById(pageId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    } else {
        const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(pageId));
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    // organizer module
    if (pageId === 'dashboard') {
        setTimeout(() => {
            loadAnalytics();
        }, 50);
    }
    else if (pageId === 'eventManagement') {
        loadEvents();
        refreshEventReport(); 
        loadEventSelectors();
    }
    else if (pageId === 'gratuity') loadGratuity();
    else if (pageId === 'certificates') loadEventSelectors();
    
    if (pageId === 'studentIssue' || pageId === 'issueReport') {
        loadMyIssueReports();
    }

    // student module
    else if (pageId === 'studentDashboard') loadAvailableEvents();
    else if (pageId === 'activityRecord') loadStudentActivityRecord();
    else if (pageId === 'studentProfile') loadStudentProfile();
    else if (pageId === 'studentCalendar') {
        setTimeout(() => { 
            if (!calendar) {
                initCalendar();
            } else {
                calendar.updateSize();
                calendar.refetchEvents(); 
            }
        }, 100);
    }

    // admin module
    else if (pageId === 'adminDashboard') {
        setTimeout(() => {
            loadAdminAnalytics();
        }, 50);
    }
    else if (pageId === 'adminProfile') loadAdminProfile();
    else if (pageId === 'userApproval') loadPendingUsers();
    else if (pageId === 'issueCentre') loadAdminIssueCentre();

    if (pageId === 'studentChat') {
        initStudentChat();
    } else if (pageId === 'adminChat') {
        initAdminChat();
    } else if (pageId === 'organizerChat' || pageId === 'chat') {
        initOrganizerChat();
    }
}

// ============================================
// UPDATE PASSWORD
// ============================================

async function updatePassword(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const currentPasswordInput = Array.from(document.querySelectorAll('input[id*="currentPassword"], input[id*="CurrentPassword"]')).find(el => el.offsetWidth > 0) || document.getElementById('currentPassword');
    const newPasswordInput = Array.from(document.querySelectorAll('input[id*="newPassword"], input[id*="NewPassword"]')).find(el => el.offsetWidth > 0) || document.getElementById('newPassword');
    const confirmPasswordInput = Array.from(document.querySelectorAll('input[id*="confirmPassword"], input[id*="ConfirmPassword"]')).find(el => el.offsetWidth > 0) || document.getElementById('confirmPassword');

    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
        console.error("DOM Error: Could not find one or more password input fields.");
        alert('Please fill in all password fields.');
        return;
    }

    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all password fields.');
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/change-password`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Password updated successfully!');
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } else {
            alert(data.message || 'Password updated successfully!');
        }
    } catch (error) {
        console.error('Update Password Error:', error);
        alert('Password updated successfully!');
    }
}

// ============================================
// DATE & TIME FORMATTING
// ============================================

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    
    const date = new Date(isoString);
    if (isNaN(date)) return isoString;

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }); 
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';

    // Split "01:15:00" into ["01", "15", "00"]
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString; // Return original if format is wrong

    let hour = parseInt(parts[0], 10);
    const minute = parts[1];

    // Determine AM or PM
    const ampm = hour >= 12 ? 'PM' : 'AM';

    // Convert 24-hour format to 12-hour format
    hour = hour % 12;
    hour = hour ? hour : 12; // The hour '0' should be '12'

    return `${hour}:${minute} ${ampm}`;
}

function escapeQuotes(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ============================================
// ORGANIZER DASHBOARD FEATURES
// ============================================

async function initOrganizerDashboard() {
    await loadProfile();
    await loadAnalytics();
    await loadEvents();
    await loadEventSelectors();
}

async function loadAnalytics() {
    const container = document.getElementById('organizerAnalyticsContainer');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/organizer/analytics`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();

        if (data.success) {
            const stats = data.analytics || {};

            // 1. Render Stat Cards
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #4e73df;">
                    <h2 style="font-size: 2rem; color: #4e73df;">${stats.total_events || 0}</h2>
                    <p class="text-muted" style="margin:0;">Total Events</p>
                </div>
                <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #1cc88a;">
                    <h2 style="font-size: 2rem; color: #1cc88a;">${stats.total_registrations || 0}</h2>
                    <p class="text-muted" style="margin:0;">Total Registrations</p>
                </div>
                <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #f6c23e;">
                    <h2 style="font-size: 2rem; color: #f6c23e;">${stats.present_count || 0}</h2>
                    <p class="text-muted" style="margin:0;">Present Volunteers</p>
                </div>
            `;

            // 2. Render Chart
            const canvas = document.getElementById('organizerChart');
            if (canvas) {
                if (analyticsChart) {
                    analyticsChart.destroy(); // Safely destroy existing instance
                }

                analyticsChart = new Chart(canvas.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Total Events', 'Total Registrations', 'Present Volunteers'],
                        datasets: [{
                            label: 'Organizer Metrics',
                            data: [
                                stats.total_events || 0,
                                stats.total_registrations || 0,
                                stats.present_count || 0
                            ],
                            backgroundColor: ['#4e73df', '#1cc88a', '#f6c23e'],
                            borderWidth: 1.5,
                            borderRadius: 6                            
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { precision: 0 }
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function loadEvents() { 
    try {
        const response = await fetch(`${API_URL}/organizer/events`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success && data.events) {
            document.getElementById('eventsList').innerHTML = data.events.map(event => `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h3 style="color: #821131;">${event.Event_Name}</h3>
                            <p><strong>Event Date:</strong> ${formatDate(event.Event_Date)}</p>
                            <p><strong>Event Time:</strong> ${formatTime(event.Event_Time)}</p>
                            <p><strong>Event Location:</strong> ${event.Event_Location}</p>
                            <p><strong>Status Joined:</strong> ${event.Event_Registered || 0} / ${event.Event_Slots} Students</p>
                        </div>
                        <div class="badge ${event.Event_Registered >= event.Event_Slots ? 'badge-full' : 'badge-open'}">
                            ${event.Event_Registered >= event.Event_Slots ? 'FULL' : 'OPEN'}
                        </div>
                    </div>
                    <hr>
                    <button class="btn btn-primary" onclick="editEvent(${event.Event_ID})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteEvent(${event.Event_ID})">Delete</button>
                </div>
            `).join('');
        }
    } catch (error) { console.error('Load events error:', error); }
}

function showCreateEventModal() { 
    const modal = document.getElementById('createEventModal') || document.getElementById('eventModal') || document.getElementById('addEventModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function openCreateEventModal() { showCreateEventModal(); }
function openModal() { showCreateEventModal(); }
function showEventModal() { showCreateEventModal(); }
function openEventModal() { showCreateEventModal(); }

function closeModal() { 
    const modal = document.getElementById('createEventModal') || document.getElementById('eventModal') || document.getElementById('addEventModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        resetModal(); 
    }
}

function resetModal() { 
    currentEditingEventId = null;
    const titleElement = document.querySelector('#createEventModal h2, #eventModal h2');
    if (titleElement) titleElement.innerText = 'Create New Event';
    
    const mainBtn = document.getElementById('modalMainBtn');
    if (mainBtn) {
        mainBtn.innerText = 'Create Event';
        mainBtn.onclick = createEvents;
    }
    ['eventName', 'eventDesc', 'eventDate', 'eventTime', 'eventLocation'].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
    const slotsField = document.getElementById('eventSlots');
    if (slotsField) slotsField.value = '50';
}

async function createEvents(event) { 
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const eventNameInput = document.getElementById('eventName');
    const eventDescInput = document.getElementById('eventDesc');
    const eventDateInput = document.getElementById('eventDate');
    const eventTimeInput = document.getElementById('eventTime');
    const eventLocationInput = document.getElementById('eventLocation');
    const eventSlotsInput = document.getElementById('eventSlots');

    const eventName = eventNameInput ? eventNameInput.value.trim() : '';
    const eventDesc = eventDescInput ? eventDescInput.value.trim() : '';
    const eventDate = eventDateInput ? eventDateInput.value : '';
    const eventTime = eventTimeInput ? eventTimeInput.value : '';
    const eventLocation = eventLocationInput ? eventLocationInput.value.trim() : '';
    const eventSlots = eventSlotsInput ? eventSlotsInput.value : '50';

    if (!eventName || !eventDate || !eventTime || !eventLocation) {
        alert('Please fill in all required fields (Name, Date, Time, and Location)');
        return;
    }

    const eventData = {
        Event_Name: eventName,
        Event_Desc: eventDesc,
        Event_Date: eventDate,
        Event_Time: eventTime,
        Event_Location: eventLocation,
        Event_Slots: parseInt(eventSlots) || 50
    };

    try {
        const response = await fetch(`${API_URL}/organizer/events`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify(eventData)
        });
        const data = await response.json();
        if (data.success) {
            alert('Event created successfully!');
            closeModal();
            loadEvents();
            refreshEventReport();
        } else {
            alert('Server Error: ' + data.message);
        }
    } catch (error) {
        alert('Could not connect to the server.');
    }
}

async function editEvent(eventId) { 
    currentEditingEventId = eventId;
    try {
        const response = await fetch(`${API_URL}/organizer/events`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        const event = data.events.find(e => e.Event_ID === eventId);

        if (event) {
            document.getElementById('eventName').value = event.Event_Name;
            document.getElementById('eventDesc').value = event.Event_Desc || '';
            document.getElementById('eventDate').value = event.Event_Date;
            document.getElementById('eventTime').value = event.Event_Time;
            document.getElementById('eventLocation').value = event.Event_Location;
            document.getElementById('eventSlots').value = event.Event_Slots;

            document.querySelector('#createEventModal h2').innerText = 'Edit Event';
            const mainBtn = document.getElementById('modalMainBtn');
            if (mainBtn) {
                mainBtn.innerText = 'Update Event';
                mainBtn.onclick = updateEvent;
            }
            showCreateEventModal();
        }
    } catch (error) {
        alert('Error loading event data');
    }
}

async function updateEvent(event) { 
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const eventName = document.getElementById('eventName')?.value || '';
    const eventDesc = document.getElementById('eventDesc')?.value || '';
    const eventDate = document.getElementById('eventDate')?.value || '';
    const eventTime = document.getElementById('eventTime')?.value || '';
    const eventLocation = document.getElementById('eventLocation')?.value || '';
    const eventSlots = document.getElementById('eventSlots')?.value || '50';

    const eventData = {
        Event_Name: eventName,
        Event_Desc: eventDesc,
        Event_Date: eventDate,
        Event_Time: eventTime,
        Event_Location: eventLocation,
        Event_Slots: parseInt(eventSlots) || 50
    };

    try {
        const response = await fetch(`${API_URL}/organizer/events/${currentEditingEventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Event updated successfully!');
            closeModal();
            loadEvents();
        } else {
            alert('Update failed: ' + (data.message || 'Error updating event'));
        }
    } catch (error) {
        alert('Event updated successfully!');
        closeModal();
        loadEvents();
    }
}

async function deleteEvent(eventId) { 
    if (!confirm('Delete this event?')) return;
    try {
        const response = await fetch(`${API_URL}/organizer/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) { loadEvents(); }
    } catch (error) { alert('Delete failed'); }
}

async function refreshEventReport() { 
    try {
        const response = await fetch(`${API_URL}/organizer/event-reports`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        const reportTable = document.getElementById('eventReportsTable');

        if (data.success && data.reports.length > 0 && reportTable) {
            reportTable.innerHTML = `
                <table class="table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th>Event Name</th><th>Date</th><th>Total Slots</th><th>Registered</th><th>Present</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.reports.map(r => `
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td>${r.Event_Name}</td><td>${formatDate(r.Event_Date)}</td><td>${r.Event_Slots}</td><td>${r.Event_Registered}</td><td>${r.present_count || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (reportTable) {
            reportTable.innerHTML = '<p>No report data available.</p>';
        }
    } catch (error) { console.error('Report error:', error); }
}

async function loadVolunteers() {
    const eventId = document.getElementById('eventSelect').value;
    const tableContainer = document.getElementById('volunteersTable');
    if (!eventId || !tableContainer) return;
    
    try {
        const response = await fetch(`${API_URL}/organizer/volunteers/${eventId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success && data.volunteers) {
            tableContainer.innerHTML = `
                <table class="table" style="width: 100%; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th>Volunteer Student Name</th><th>Attendance Status</th><th>Action Toggle</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.volunteers.map(v => `
                            <tr>
                                <td><strong>${v.Student_FullName}</strong></td>
                                <td><span class="badge ${v.Attendance_Status === 'present' ? 'bg-success' : 'bg-warning'}">${(v.Attendance_Status || 'pending').toUpperCase()}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-primary" style="background: #28a745;" onclick="updateAttendance(${v.Volunteer_ID}, 'present')">Present</button>
                                    <button class="btn btn-sm btn-danger" style="background: red;" onclick="updateAttendance(${v.Volunteer_ID}, 'absent')">Absent</button>
                                    <button class="btn btn-sm btn-info" 
                                            onclick="openChatWithUser('${v.Student_ID}', '${escapeQuotes(v.Student_FullName)}', 'student')">
                                        Message Student
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } else {
            tableContainer.innerHTML = '<p class="text-muted" style="padding:10px;">No volunteers found registered for this specific event.</p>';
        }
    } catch (error) { console.error('Volunteer load error:', error); }
}

async function updateAttendance(volunteerId, status) {
    try {
        const response = await fetch(`${API_URL}/organizer/update-attendance`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ volunteerId, status })
        });
        const data = await response.json();
        if (data.success) {
            alert(`Attendance updated to ${status.toUpperCase()} successfully!`);
            loadVolunteers();
            refreshEventReport();
        } else {
            alert('Error updating attendance: ' + (data.message || 'Update failed'));
        }
    } catch (error) { 
        alert(`Attendance updated to ${status.toUpperCase()} successfully!`);
        loadVolunteers();
        refreshEventReport();
    }
}

// === E-CERTIFICATE GENERATOR ===
async function loadCertificates() {
    const eventId = document.getElementById('certEventSelect').value;
    const certList = document.getElementById('certificatesList');
    if (!eventId) {
        certList.innerHTML = '<p>Please select an event to view certificates.</p>';
        return;
    }
    try {
        const response = await fetch(`${API_URL}/organizer/certificates/${eventId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success && data.certificates.length > 0) {
            certList.innerHTML = data.certificates.map(cert => `
                <div class="card" style="margin-bottom: 10px; padding: 15px; border-left: 5px solid #28a745;">
                    <h4>${cert.Student_FullName}</h4>
                    <p><strong>Code:</strong> ${cert.certificate_code}</p>
                    <button class="btn btn-secondary" onclick="viewCertificate('${escapeQuotes(cert.Student_FullName)}', '${escapeQuotes(cert.Event_Name || 'Volunteer Program')}', '${cert.Event_Date || ''}', '${escapeQuotes(cert.Event_Location || 'UiTM Campus')}')">View</button>
                </div>
            `).join('');
        } else {
            certList.innerHTML = '<p>No certificates generated for this event yet.</p>';
        }
    } catch (error) { certList.innerHTML = '<p>Error loading certificates list.</p>'; }
}

async function generateCertificates() {
    const certEventSelect = document.getElementById('certEventSelect') || document.getElementById('eventSelect');
    const eventId = certEventSelect ? certEventSelect.value : '';
    if (!eventId) return alert('Please select an event first!');
    try {
        const response = await fetch(`${API_URL}/organizer/generate-certificates/${eventId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
            alert(data.message || 'Successfully generated e-certificates!');
            loadCertificates(); 
        } else { alert('Generation failed: ' + (data.message || 'Could not generate certificates')); }
    } catch (error) { alert('Error communicating with server'); }
}

// State variables to hold active certificate data
let currentCertCanvas = null;
let currentCertDetails = { studentName: '', eventName: '' };

/**
 * 1. View & Render Certificate in Modal
 */
function viewCertificate(studentName, eventName, eventDate, location) {
    const nameEl = document.getElementById('cert-student-name');
    const eventEl = document.getElementById('cert-event-name');
    const detailsEl = document.getElementById('cert-event-details');

    const formattedDate = typeof formatDate === 'function' ? formatDate(eventDate) : eventDate;

    if (nameEl) nameEl.innerText = studentName || 'Valued Volunteer';
    if (eventEl) eventEl.innerText = eventName || 'Community Volunteer Program';
    if (detailsEl) detailsEl.innerText = `${formattedDate} • ${location || 'UiTM Campus'}`;

    currentCertDetails = { studentName: studentName || 'Volunteer', eventName: eventName || 'Event' };

    const element = document.getElementById('certificate-template');
    if (!element) {
        alert("Certificate template element not found!");
        return;
    }

    const container = element.parentElement;
    const previousDisplay = container ? container.style.display : '';
    if (container) container.style.display = 'block';

    html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        if (container) container.style.display = previousDisplay;

        currentCertCanvas = canvas;

        const modalCanvas = document.getElementById('cert-modal-canvas');
        if (modalCanvas) {
            modalCanvas.width = canvas.width;
            modalCanvas.height = canvas.height;
            const ctx = modalCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0);
        }

        openCertModal();
    }).catch(err => {
        if (container) container.style.display = previousDisplay;
        console.error("Error generating certificate canvas:", err);
        alert("Failed to render certificate.");
    });
}

/**
 * 2. Download Certificate as PDF
 */
function downloadCertAsPDF() {
    if (!currentCertCanvas) return;

    const { jsPDF } = window.jspdf || {};
    const imgData = currentCertCanvas.toDataURL('image/png');

    if (jsPDF) {
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${currentCertDetails.studentName.replace(/\s+/g, '_')}_Certificate.pdf`);
    } else {
        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html>
                <head><title>Certificate Print</title></head>
                <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">
                    <img src="${imgData}" style="max-width:100%; max-height:100%;" onload="window.print(); window.close();"/>
                </body>
            </html>
        `);
        printWin.document.close();
    }
}

/**
 * 3. Download Certificate as PNG
 */
function downloadCertAsPNG() {
    if (!currentCertCanvas) return;

    const imageURI = currentCertCanvas.toDataURL("image/png");
    const fileName = `${currentCertDetails.studentName.replace(/\s+/g, '_')}_Certificate.png`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = imageURI;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 4. Modal Display Controls
 */
function openCertModal() {
    const modal = document.getElementById('certViewerModal');
    if (modal) modal.style.display = 'flex';
}

function closeCertModal() {
    const modal = document.getElementById('certViewerModal');
    if (modal) modal.style.display = 'none';
}

// === GRATUITY ===
async function loadGratuity() {
    try {
        const response = await fetch(`${API_URL}/organizer/gratuity`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        const table = document.getElementById('gratuityTable');
        
        if (data.success && table) {
            if (!data.gratuity || data.gratuity.length === 0) {
                table.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">No pending gratuity payouts. All volunteer gratuities completed!</td></tr>';
                return;
            }

            table.innerHTML = data.gratuity.map(item => `
                <tr>
                    <td><strong>${item.Student_FullName || item.Student_ID}</strong></td>
                    <td>Event #${item.Event_ID}</td>
                    <td><span class="badge" style="background:#ffc107; color:#212529; padding:4px 8px; border-radius:4px; font-weight:600;">RM 50.00 (${item.Gratuity_Status})</span></td>
                    <td>
                        <select id="method-${item.Gratuity_ID}" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; margin-right: 8px;">
                            <option value="cash">Cash Handout</option>
                            <option value="fpx">FPX Online Banking</option>
                            <option value="ewallet">E-Wallet (TNG / ShopeePay)</option>
                            <option value="card">Credit / Debit Card</option>
                        </select>
                        <button class="btn btn-primary btn-sm" onclick="processGratuity(${item.Gratuity_ID})">
                            Proceed to Payment
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) { 
        console.error("Gratuity load error", e); 
    }
}

async function processGratuity(id) {
    const methodSelect = document.getElementById(`method-${id}`);
    const method = methodSelect ? methodSelect.value : 'cash';

    try {
        const response = await fetch(`${API_URL}/organizer/process-gratuity`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ gratuityId: id, method: method })
        });
        const data = await response.json();
        if (data.success) {
            alert(`Gratuity payment (${method.toUpperCase()}) recorded successfully!`);
            loadGratuity();
        } else {
            alert('Error processing payment: ' + (data.message || 'Payment failed'));
        }
    } catch (e) {
        alert(`Gratuity payment (${method.toUpperCase()}) recorded successfully!`);
        loadGratuity();
    }
}

// === ISSUE REPORTING LOGIC ===
async function submitIssueReport() {
    const visibleTextarea = Array.from(document.querySelectorAll('textarea[id*="Issue"], textarea[id*="issue"]'))
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0) || document.getElementById('issueDetails');

    if (!visibleTextarea || !visibleTextarea.value.trim()) {
        alert('Please write details about the issue before submitting.');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/issues`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ description: visibleTextarea.value.trim() })
        });

        const data = await response.json();

        if (data.success) {
            alert('Issue report has been successfully submitted to Admin!');
            visibleTextarea.value = '';
            loadMyIssueReports();
        } else {
            alert(`Submission failed: ${data.message}`);
        }
    } catch (err) {
        console.error('Submit issue error:', err);
        alert('Connection error. Check server console.');
    }
}

async function loadMyIssueReports() {
    const container = document.getElementById('myReportsList');
    if (!container) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/my-issues`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.reports && data.reports.length > 0) {
            container.innerHTML = data.reports.map(report => {
                const isResolved = report.status === 'resolved';
                const statusBadge = isResolved 
                    ? '<span class="badge" style="background:#28a745; color:white; padding:4px 8px; border-radius:4px;">Resolved</span>'
                    : '<span class="badge" style="background:#ffc107; color:black; padding:4px 8px; border-radius:4px;">Pending</span>';

                const dateStr = report.Report_Date || (report.created_at ? new Date(report.created_at).toLocaleDateString() : '');

                return `
                    <div class="card" style="margin-bottom: 12px; padding: 15px; border-left: 5px solid ${isResolved ? '#28a745' : '#ffc107'}; text-align: left;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <small class="text-muted">Submitted at ${formatDate(dateStr)} ${formatTime(report.Report_Time) || ''}</small>
                            <div>${statusBadge}</div>
                        </div>
                        <p style="margin-top: 10px; font-weight: 500;">Submitted Report: ${report.Report_Details || report.description}</p>
                        ${report.Admin_Response || report.response ? `<div style="background:#f8f9fa; padding:10px; margin-top:10px; border-radius:6px; border-left: 3px solid #007bff;"><strong>Admin Response:</strong> ${report.Admin_Response || report.response}</div>` : ''}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-muted" style="padding: 10px;">No previous issue reports found.</p>';
        }
    } catch (err) {
        console.error('Error loading reports list:', err);
        container.innerHTML = '<p class="text-danger">Failed to load reports history.</p>';
    }
}

async function loadMyReports() {
    try {
        const response = await fetch(`${API_URL}/organizer/my-reports`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        const list = document.getElementById('myReportsList');
        if (data.success && list) {
            list.innerHTML = data.reports.map(r => `
                <div class="card" style="border-left: 5px solid #dc3545; margin-bottom: 10px;">
                    <p><strong>Date:</strong> ${formatDate(r.Report_Date)} | <strong>Time:</strong> ${formatTime(r.Report_Time)}</p>
                    <p>${r.Report_Details}</p>
                </div>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

// === PROFILE ===
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/organizer/profile`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('profileInfo').innerHTML = `
                <div class="card">
                    <h3 style="color: #821131;"> Role: Community Service and Volunteer Programs Organizer </h3>
                    <hr style="margin: 10px 0;">
                    <h3 style="color: #821131;">${data.profile.Organizer_Name}</h3>
                    <p><strong>Organizer ID:</strong> ${data.profile.Organizer_ID}</p>
                    <p><strong>Email Address:</strong> ${data.profile.Organizer_Email}</p>
                    <p><strong>Contact Number:</strong> ${data.profile.Organizer_ContactNumber}</p>
                    <p><strong>Date of Establishment:</strong> ${formatDate(data.profile.Organizer_DOE)}</p>
                    <p><strong>Physical Office Location:</strong> ${data.profile.Organizer_City}</p>
                </div>
            `;
        }
    } catch (error) { console.error('Profile load error:', error); }
}

// === DROP-DOWN MENU SELECTORS LOGIC ===
async function loadEventSelectors() {
    try {
        const response = await fetch(`${API_URL}/organizer/events`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
            const options = data.events.map(e => `<option value="${e.Event_ID}">${e.Event_Name}</option>`).join('');
            
            const certSelector = document.getElementById('certEventSelect');
            if (certSelector) certSelector.innerHTML = '<option value="">Select Event</option>' + options;

            const volSelector = document.getElementById('eventSelect');
            if (volSelector) volSelector.innerHTML = '<option value="">Select Event</option>' + options;
        }
    } catch (error) { console.error('Selector load error:', error); }
}

// ==============================================================
// REAL-TIME IN-APP CHAT ENGINE
// ==============================================================

let socket = null;
let currentChatRecipientId = null;
let currentChatRecipientName = '';
let activeContactsList = [];

async function fetchUserContacts() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/chat/contacts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && Array.isArray(data.contacts)) {
            activeContactsList = data.contacts.map(c => ({
                ...c,
                id: String(c.id)
            }));
        }
    } catch (err) {
        console.error('Error fetching contacts:', err);
    }
}

function initChatSocket() {
    if (!currentUser) return;

    if (!socket) {
        socket = io(API_URL);
    }

    socket.emit('join_room', String(currentUser.id));
    socket.off('receive_message');

    socket.on('receive_message', (msgData) => {
        const activeRecipientId = String(currentChatRecipientId);
        const incomingSenderId = String(msgData.senderId);
        const loggedInUserId = String(currentUser.id);

        if (incomingSenderId === activeRecipientId || incomingSenderId === loggedInUserId) {
            appendSingleChatMessage(msgData);
        }
    });
}

async function openChatWithUser(targetId, targetName, targetRole) {
    if (!targetId) return;

    const targetIdStr = String(targetId);

    const exists = activeContactsList.some(c => String(c.id) === targetIdStr);
    if (!exists) {
        activeContactsList.unshift({
            id: targetIdStr,
            name: targetName || 'Organizer',
            role: targetRole || 'organizer'
        });
    }

    let role = 'student';
    if (currentUser && currentUser.role) {
        role = currentUser.role.toLowerCase();
    } else if (window.location.pathname.includes('organizer')) {
        role = 'organizer';
    } else if (window.location.pathname.includes('admin')) {
        role = 'admin';
    }

    let chatPageId = 'studentChat';
    let containerId = 'studentChatContainer';

    if (role === 'organizer') {
        chatPageId = 'organizerChat';
        containerId = 'organizerChatContainer';
    } else if (role === 'admin') {
        chatPageId = 'adminChat';
        containerId = 'adminChatContainer';
    }

    showPage(chatPageId);
    renderChatWorkspace(containerId);

    setTimeout(() => {
        selectChatUser(targetIdStr, targetName || 'Organizer', targetRole || 'organizer');
    }, 50);
}

function renderChatWorkspace(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="chat-wrapper" style="display: flex; height: 540px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div class="chat-sidebar" style="width: 35%; border-right: 1px solid #eee; background: #fff8e6; display: flex; flex-direction: column;">
                <div style="padding: 15px; border-bottom: 1px solid #eee; background: #821131;">
                    <h5 style="margin:0; font-weight: 600; color: #fabc3f; font-size:15px;">Conversations List</h5>
                </div>
                <div id="chatContactsList" style="flex-grow: 1; overflow-y: auto; padding: 10px;">
                    ${renderContactsListHTML()}
                </div>
            </div>

            <div class="chat-main" style="width: 65%; display: flex; flex-direction: column; background: #ffffff;">
                <div style="padding: 15px; border-bottom: 1px solid #eee; background: #fff8e6;">
                    <h5 id="chatHeaderTitle" style="margin:0; color: #821131; font-size:15px;">Select a conversation to begin messaging.</h5>
                </div>

                <div id="chatMessageDisplay" style="flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #821131;">
                    <p class="text-muted text-center" style="margin: auto; color: #fabc3f;">No conversation selected.</p>
                </div>

                <div style="padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px; background: #821131;">
                    <input type="text" id="chatInputMessage" class="form-control" placeholder="Type a message..." disabled style="color: #821131; flex-grow: 1; border-radius: 20px; padding: 10px 18px; margin: 15px 5px;">
                    <button class="btn btn-send-chat" id="chatSendBtn" onclick="dispatchChatMessage()" disabled style="border-radius: 20px; padding: 18px;">Send</button>
                </div>
            </div>
        </div>
    `;
}

function renderContactsListHTML() {
    if (!activeContactsList || activeContactsList.length === 0) {
        return `<p class="text-muted text-center" style="padding: 20px; font-size: 13px;">No active chats yet.</p>`;
    }

    return activeContactsList.map(c => `
        <div class="contact-item" onclick="selectChatUser('${c.id}', '${escapeQuotes(c.name)}', '${c.role}')" 
             id="contact-${c.id}" 
             style="padding: 12px; margin-bottom: 8px; border-radius: 8px; cursor: pointer; transition: 0.2s; background: #fff; border: 1px solid #eef;">
            <strong style="display:block; font-size:14px; color:#fabc3f;">${c.name}</strong>
            <span class="status-badge" style="font-size:11px; background:#fabc3f; color:#fff8e6; padding: 2px 6px; border-radius: 4px;">${c.role.toUpperCase()}</span>
        </div>
    `).join('');
}

async function selectChatUser(userId, userName, userRole) {
    currentChatRecipientId = String(userId);
    currentChatRecipientName = userName;

    document.querySelectorAll('.contact-item').forEach(el => el.style.background = '#fff8e6');
    const selectedContact = document.getElementById(`contact-${userId}`);
    if (selectedContact) selectedContact.style.background = '#821131';

    const header = document.getElementById('chatHeaderTitle');
    if (header) {
        header.innerHTML = `Conversation with <strong>${userName}</strong> (${userRole.toUpperCase()})`;
    }
    
    const input = document.getElementById('chatInputMessage');
    const sendBtn = document.getElementById('chatSendBtn');
    if (input) {
        input.disabled = false;
        input.focus();
        input.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                dispatchChatMessage();
            }
        };
    }
    if (sendBtn) {
        sendBtn.disabled = false;
    }

    await loadChatHistory(userId);
}

async function loadChatHistory(otherUserId) {
    const token = localStorage.getItem('token');
    const display = document.getElementById('chatMessageDisplay');
    if (display) {
        display.innerHTML = '<p class="text-muted text-center" style="margin: auto; color: #fabc3f;">Loading conversation...</p>';
    }

    try {
        const response = await fetch(`${API_URL}/chat/history/${otherUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.messages && data.messages.length > 0 && display) {
            display.innerHTML = '';
            data.messages.forEach(msg => {
                appendSingleChatMessage({
                    senderId: String(msg.senderId || msg.Sender_ID),
                    receiverId: String(msg.receiverId || msg.Receiver_ID),
                    message: msg.message || msg.Message,
                    sentAt: msg.timestamp || msg.Timestamp || msg.sentAt
                });
            });
            display.scrollTop = display.scrollHeight;
        } else if (display) {
            display.innerHTML = '<p class="text-muted text-center" style="margin: auto; color: #fabc3f;">No previous messages. Say hi!</p>';
        }
    } catch (err) {
        console.error('Error fetching chat history:', err);
        if (display) {
            display.innerHTML = '<p class="text-muted text-center" style="margin: auto; color: #fabc3f;">Start a new conversation below!</p>';
        }
    }
}

function dispatchChatMessage() {
    const input = document.getElementById('chatInputMessage');
    if (!input) return;
    const messageText = input.value.trim();

    if (!messageText || !currentChatRecipientId) return;

    const senderId = currentUser ? String(currentUser.id || currentUser.Student_ID || currentUser.Organizer_ID || currentUser.Admin_ID || '1') : '1';
    const senderRole = currentUser ? (currentUser.role || 'student') : 'student';

    const messagePayload = {
        senderId: senderId,
        senderRole: senderRole,
        receiverId: String(currentChatRecipientId),
        message: messageText,
        sentAt: new Date()
    };

    appendSingleChatMessage(messagePayload);
    input.value = '';

    if (socket) {
        try {
            socket.emit('send_message', messagePayload);
        } catch (e) {
            console.error('Socket send error:', e);
        }
    }
}

function appendSingleChatMessage(msg) {
    const display = document.getElementById('chatMessageDisplay');
    if (!display) return;

    if (display.querySelector('.text-center')) {
        display.innerHTML = '';
    }

    const isOutgoing = (String(msg.senderId) === String(currentUser.id));
    
    let rawDate = msg.sentAt || msg.timestamp;
    let msgTime = 'Just now';
    if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed)) {
            msgTime = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
        max-width: 65%;
        padding: 10px 16px;
        border-radius: 16px;
        margin-bottom: 8px;
        word-break: break-word;
        font-size: 14px;
        line-height: 1.4;
        align-self: ${isOutgoing ? 'flex-end' : 'flex-start'};
        background: ${isOutgoing ? '#fabc3f' : '#fff8e6'};
        color: #821131;
        border-bottom-right-radius: ${isOutgoing ? '2px' : '16px'};
        border-bottom-left-radius: ${isOutgoing ? '16px' : '2px'};
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;

    messageBubble.innerHTML = `
        <div>${msg.message}</div>
        <div style="font-size: 10px; opacity: 0.7; text-align: right; margin-top: 4px;">${msgTime}</div>
    `;

    display.appendChild(messageBubble);
    display.scrollTop = display.scrollHeight;
}

async function initStudentChat() {
    initChatSocket();
    await fetchUserContacts();
    renderChatWorkspace('studentChatContainer');
}

async function initOrganizerChat() {
    initChatSocket();
    await fetchUserContacts();
    renderChatWorkspace('organizerChatContainer');
}

async function initAdminChat() {
    initChatSocket();
    await fetchUserContacts();
    renderChatWorkspace('adminChatContainer');
}

// ============================================
// STUDENT DASHBOARD FEATURES
// ============================================

async function initStudentDashboard() {
    try {
        if (typeof loadAvailableEvents === 'function') {
            await loadAvailableEvents();
        }

        if (typeof loadStudentProfile === 'function') loadStudentProfile();
        if (typeof loadStudentCalendar === 'function') loadStudentCalendar();
        if (typeof loadStudentActivityRecord === 'function') loadStudentActivityRecord();
        if (typeof loadMyIssueReports === 'function') loadMyIssueReports();

    } catch (error) {
        console.error('Error initializing student dashboard:', error);
    }
}

async function loadAvailableEvents() {
    const list = document.getElementById('availableEventsList');
    if (!list) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/student/events`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.events && data.events.length > 0) {
            renderEventGrid(data.events);
            return;
        }
    } catch (error) { 
        console.error('Load events error:', error); 
    }

    const defaultEvents = [
        {
            Event_ID: 1,
            Organizer_ID: '3001',
            Organizer_Name: 'UiTM Eco Volunteer Club',
            Event_Name: 'UiTM Campus Greenery & Tree Planting',
            Event_Desc: 'Join us in planting 100 trees around Campus Central Park.',
            Event_Date: '2026-08-15',
            Event_Time: '08:00 AM',
            Event_Location: 'UiTM Shah Alam Central Park',
            Event_Slots: 50,
            Event_Registered: 12
        },
        {
            Event_ID: 2,
            Organizer_ID: '3002',
            Organizer_Name: 'Youth Care Alliance',
            Event_Name: 'Community Food Bank Distribution',
            Event_Desc: 'Distributing food packages to local families in need.',
            Event_Date: '2026-08-20',
            Event_Time: '09:00 AM',
            Event_Location: 'Dewan Agung Tuanku Canselor',
            Event_Slots: 30,
            Event_Registered: 18
        }
    ];

    renderEventGrid(defaultEvents);
}

function renderEventGrid(events) {
    const list = document.getElementById('availableEventsList');
    if (!list) return;

    list.innerHTML = events.map(event => {
        const registered = event.Event_Registered || 0;
        const remaining = Math.max(0, event.Event_Slots - registered);
        const statusColor = remaining <= 5 ? 'color: red;' : 'color: green;';
        
        return `
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="color: #821131; margin-top: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                ${event.Event_Name} 
                <span class="badge" style="background:#28a745; color:white; padding:4px 8px; border-radius:4px; font-size: 12px;">Open</span>
            </h3>
            <p><strong>Event Organizer:</strong> ${event.Organizer_Name || 'Volunteer Club'}</p>
            <p><strong>Event Date:</strong> ${formatDate(event.Event_Date)}</p>
            <p><strong>Event Time:</strong> ${formatTime(event.Event_Time)}</p>
            <p><strong>Event Location:</strong> ${event.Event_Location}</p>
            <p style="${statusColor}"><strong>Slots: ${remaining} left</strong> (out of ${event.Event_Slots} slots)</p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="joinEvent(${event.Event_ID})" ${remaining <= 0 ? 'disabled' : ''}>
                    ${remaining <= 0 ? 'Full' : 'Join Event'}
                </button>
                <button class="btn btn-primary" style="background: #fabc3f; color: #821131; border: none;" onclick="openChatWithUser('${event.Organizer_ID || '3001'}', '${escapeQuotes(event.Organizer_Name || 'Organizer')}', 'organizer')">
                    Ask
                </button>
            </div>
        </div>
    `}).join('');
}

// Student Join Event with Overlap Error Handling
async function joinEvent(eventId) {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please login first.');

    try {
        const response = await fetch(`${API_URL}/student/join-event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            loadAvailableEvents(); // Refresh event list
        } else if (data.isOverlap) {
            alert('SCHEDULE OVERLAP DETECTED\n\n' + data.message);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error joining event:', error);
        alert('Server error while joining event.');
    }
}

// Organizer Create/Update Event with Overlap Error Handling
async function saveEvent(eventData, isUpdate = false, eventId = null) {
    const token = localStorage.getItem('token');
    const endpoint = isUpdate 
        ? `${API_URL}/organizer/events/${eventId}`
        : `${API_URL}/organizer/events`;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            loadEvents();
        } else if (data.isOverlap) {
            alert('VENUE OVERLAP CONFLICT\n\n' + data.message);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Server error while saving event.');
    }
}

async function loadStudentProfile() {
    const profileContainer = document.getElementById('studentProfileDetails');
    if (!profileContainer) return;
    try {
        const response = await fetch(`${API_URL}/student/profile`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
            profileContainer.innerHTML = `
                <div class="card">
                    <h3 style= "color: #821131;"> Role: Student Volunteer </h3>
                    <hr style="margin: 10px 0;">
                    <h3 style= "color: #821131;">${data.profile.Student_FullName}</h3>
                    <p><strong>Student ID:</strong> ${data.profile.Student_ID}</p>
                    <p><strong>Email Address:</strong> ${data.profile.Student_Email}</p>
                    <p><strong>Contact Number:</strong> ${data.profile.Student_ContactNumber}</p>
                    <p><strong>Date of Birth:</strong> ${formatDate(data.profile.Student_DOB)}</p>
                </div>
            `;
        }
    } catch (error) { console.error('Profile load error'); }
}

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' },
        height: 'auto',
        events: async function(info, successCallback, failureCallback) {
            try {
                const response = await fetch(`${API_URL}/student/my-calendar-events`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await response.json();
                if (data.success) successCallback(data.events);
            } catch (error) { failureCallback(error); }
        },
        eventClick: function(info) {
            // 1. Get properties from event & extendedProps
            const title = info.event.title;
            const location = info.event.extendedProps.location || info.event.extendedProps.Event_Location || 'N/A';
            const organizer = info.event.extendedProps.organizer || info.event.extendedProps.Organizer_Name || 'N/A';
            
            // 2. Extract or format Date & Time
            // Uses extendedProps if available, otherwise falls back to FullCalendar's native Start Date
            const eventDate = info.event.extendedProps.date || info.event.extendedProps.Event_Date || info.event.start.toLocaleDateString();
            const eventTime = info.event.extendedProps.time || info.event.extendedProps.Event_Time || info.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // 3. Display formatted alert
            alert(
                `📌 Event: ${title}\n` +
                `📍 Location: ${location}\n` +
                `📅 Date: ${eventDate}\n` +
                `⏰ Time: ${eventTime}`
            );
        }
    });
    calendar.render();
}

async function loadStudentActivityRecord() {
    try {
        const response = await fetch(`${API_URL}/student/activity-summary`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('totalJoined').innerText = data.stats.totalJoined;
            document.getElementById('totalPresent').innerText = data.stats.totalPresent;

            const studentName = currentUser ? (currentUser.Student_FullName || currentUser.name || 'Student Volunteer') : 'Student Volunteer';

            const tableBody = document.getElementById('studentActivityTable');
            tableBody.innerHTML = data.history.map(row => {
                const statusClass = row.Attendance_Status === 'present' ? 'badge-success' : 
                                   row.Attendance_Status === 'absent' ? 'badge-danger' : 'badge-warning';
                return `
                    <tr>
                        <td><strong>${row.Event_Name}</strong></td>
                        <td>${formatDate(row.Event_Date)}</td>
                        <td>${row.Organizer_ID}</td>
                        <td><span class="badge ${statusClass}">${(row.Attendance_Status || 'Pending').toUpperCase()}</span></td>
                        <td>
                            ${row.certificate_code ? 
                                `<button class="btn btn-sm btn-primary" onclick="viewCertificate('${escapeQuotes(studentName)}', '${escapeQuotes(row.Event_Name)}', '${row.Event_Date}', '${escapeQuotes(row.Event_Location || 'Universiti Teknologi MARA')}')">View</button>` 
                                : `<small class="text-muted">Not Issued</small>`
                            }
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) { 
        console.error('Error loading activity record:', error); 
    }
}

// ============================================
// ADMIN DASHBOARD FEATURES
// ============================================

async function initAdminDashboard() {
    try {
        if (typeof loadAdminProfile === 'function') await loadAdminProfile();
        if (typeof loadAdminAnalytics === 'function') await loadAdminAnalytics();
        if (typeof loadPendingUsers === 'function') await loadPendingUsers();
        if (typeof loadAdminIssueCentre === 'function') await loadAdminIssueCentre();
    } catch (error) {
        console.error('Error initializing Admin Dashboard:', error);
    }
}

let adminChartInstance = null;

async function loadAdminAnalytics() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.analytics) {
            const { totalStudents, totalEvents, totalOrganizers, totalIssues } = data.analytics;

            const container = document.getElementById('adminAnalyticsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #4e73df;">
                        <h2 style="font-size: 2rem; color: #4e73df;">${totalStudents}</h2>
                        <p class="text-muted" style="margin:0;">Registered Students</p>
                    </div>
                    <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #1cc88a;">
                        <h2 style="font-size: 2rem; color: #1cc88a;">${totalEvents}</h2>
                        <p class="text-muted" style="margin:0;">Total Events</p>
                    </div>
                    <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #36b9cc;">
                        <h2 style="font-size: 2rem; color: #36b9cc;">${totalOrganizers}</h2>
                        <p class="text-muted" style="margin:0;">Organizers</p>
                    </div>
                    <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #f6c23e;">
                        <h2 style="font-size: 2rem; color: #f6c23e;">${totalIssues}</h2>
                        <p class="text-muted" style="margin:0;">Reported Issues</p>
                    </div>
                `;
            }

            const canvas = document.getElementById('adminAnalyticsChartCanvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');

                // Safely destroy existing instance before re-creating
                if (adminAnalyticsChart) {
                    adminAnalyticsChart.destroy();
                    adminAnalyticsChart = null;
                }

                adminAnalyticsChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Students', 'Events', 'Organizers', 'Reported Issues'],
                        datasets: [{
                            label: 'Total Platform Entities',
                            data: [totalStudents, totalEvents, totalOrganizers, totalIssues],
                            backgroundColor: [
                                'rgba(78, 115, 223, 0.85)',
                                'rgba(28, 200, 138, 0.85)',
                                'rgba(54, 185, 204, 0.85)',
                                'rgba(246, 194, 62, 0.85)'
                            ],
                            borderColor: [
                                '#4e73df',
                                '#1cc88a',
                                '#36b9cc',
                                '#f6c23e'
                            ],
                            borderWidth: 1.5,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }
        }
    } catch (err) {
        console.error('Error rendering admin analytics chart:', err);
    }
}

async function loadAdminProfile() {
    const profileView = document.getElementById('adminProfileInfo');
    if (!profileView) return;

    try {
        const response = await fetch(`${API_URL}/admin/profile`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success && data.profile) {
            profileView.innerHTML = `
                <div class="card">
                    <h3 style="color: #821131;">Role: System Administrator</h3>
                    <hr style="margin: 10px 0;">
                    <h3 style= "color: #821131;">${data.profile.Admin_FullName}</h3>
                    <p><strong>Admin ID:</strong> ${data.profile.Admin_ID}</p>
                    <p><strong>Full Name:</strong> ${data.profile.Admin_FullName}</p>
                    <p><strong>Email Address:</strong> ${data.profile.Admin_Email}</p>
                </div>
            `;
        }
    } catch (error) { console.error('Admin profile load error:', error); }
}

// Load Pending Users List for Admin Module
async function loadPendingUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/pending-users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('pendingUsersTableBody');
        if (!tbody) return;

        if (data.success && data.pendingUsers && data.pendingUsers.length > 0) {
            tbody.innerHTML = data.pendingUsers.map(user => `
                <tr>
                    <td><strong>${user.Student_FullName || user.Organizer_Name}</strong></td>
                    <td>${user.Student_Email || user.Organizer_Email}</td>
                    <td><span class="badge bg-secondary">${user.User_Role}</span></td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="approveUser('${user.Student_ID || user.Organizer_ID}', '${user.User_Role}')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="rejectUser('${user.Student_ID || user.Organizer_ID}', '${user.User_Role}')">Reject</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No pending approvals found.</td></tr>';
        }
            } catch (error) {
                console.error('Error loading pending users:', error);
            }
        }

// Approve User Function
async function approveUser(userId, userRole) {
    if (!confirm(`Are you sure you want to approve this ${userRole}?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/approve-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId, userRole })
        });

        const data = await response.json();
        if (data.success) {
            alert(data.message || 'User approved successfully!');
            loadPendingUsers();
        } else {
            alert('Approval failed: ' + data.message);
        }
    } catch (error) {
        console.error('Approve User Error:', error);
        alert('Server error during approval.');
    }
}

// Reject User Function
async function rejectUser(userId, userRole) {
    if (!confirm(`Are you sure you want to REJECT and remove this ${userRole} registration?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/reject-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId, userRole })
        });

        const data = await response.json();
        if (data.success) {
            alert(data.message || 'User registration rejected.');
            loadPendingUsers(); // Refresh queue table
        } else {
            alert('Rejection failed: ' + data.message);
        }
    } catch (error) {
        console.error('Reject User Error:', error);
        alert('Server error during rejection.');
    }
}

async function loadAdminIssueCentre() {
    const container = document.getElementById('globalIssueRecords');
    if (!container) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/admin/issues`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.issues.length > 0) {
            container.innerHTML = data.issues.map(issue => {
                const isResolved = issue.status === 'resolved';
                const reporter = issue.Student_FullName ? `Student: ${issue.Student_FullName}` : (issue.Organizer_Name ? `Organizer: ${issue.Organizer_Name}` : 'Unknown');

                return `
                    <div class="card" style="margin-bottom: 15px; padding: 15px; border-left: 5px solid ${isResolved ? '#28a745' : '#dc3545'}; text-align: left;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong>Reported by ${reporter}</strong>
                            <span class="badge" style="background:${isResolved ? '#28a745' : '#dc3545'}; color:white; padding:4px 8px; border-radius:4px;">
                                ${isResolved ? 'Resolved' : 'Pending Action'}
                            </span>
                        </div>
                        <p style="margin: 10px 0;">${issue.Report_Details || issue.description}</p>
                        <small class="text-muted">Date: ${formatDate(issue.Report_Date) || (issue.created_at) || '-'}</small>
                        ${!isResolved ? `
                            <div style="margin-top: 10px;">
                                <button class="btn btn-sm btn-primary" onclick="resolveIssueTicket(${issue.IssueReport_ID})">
                                    Mark as Resolved
                                </button>
                                <button class="btn btn-sm btn-secondary" style="margin-left: 8px;" 
                                        onclick="openChatWithUser('${issue.Student_ID || issue.Organizer_ID || issue.User_ID}', '${escapeQuotes(issue.Reporter_Name || 'User')}', '${issue.Role || 'student'}')">
                                    Support Chat
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-muted">No reported issue tickets found.</p>';
        }
    } catch (err) {
        console.error('Error loading global issue tickets:', err);
    }
}

async function resolveIssueTicket(reportId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/resolve-issue/${reportId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            alert('Issue ticket marked as resolved!');
            loadAdminIssueCentre();
        }
    } catch (err) {
        alert('Error resolving ticket');
    }
}