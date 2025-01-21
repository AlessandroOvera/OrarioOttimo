// Calendario.js

// Logica per il calendario
// I ponti scolastici variano da istituto a istituto, quindi verranno inseriti i giorni festivi in base all'istituto per la quale si opera.
const selectedDays = new Set();
const italianHolidays = [
    "01-11-2024", "25-12-2024", "26-12-2024",
    "01-01-2025", "06-01-2025", "25-04-2025",
    "01-05-2025", "02-06-2025", "15-08-2025",
    "01-11-2025", "25-12-2025", "26-12-2025"
];
const today = new Date();
let currentMonth = 8;
let currentYear = today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear();

function renderCalendar(container) {
    function updateCalendar() {
        const calendarHtml = `
            <div class="calendar-wall">
                <h2>${new Date(currentYear, currentMonth).toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
                <div id="calendar-grid">
                    ${generateDays(currentYear, currentMonth)}
                </div>
                <div class="calendar-controls">
                    <button class="arrow-button" onclick="prevMonth()">&larr;</button>
                    <button id="confirm-days" onclick="confirmSelection()">Conferma</button>
                    <button class="arrow-button" onclick="nextMonth()">&rarr;</button>
                </div>
            </div>`;
        container.innerHTML = calendarHtml;

        document.querySelectorAll('.calendar-day').forEach(day => {
            const date = day.dataset.date;

            if (italianHolidays.includes(date)) {
                day.classList.add('holiday');
                day.style.pointerEvents = 'none';
            } else {
                day.addEventListener('click', () => {
                    day.classList.toggle('selected');
                    if (selectedDays.has(date)) {
                        selectedDays.delete(date);
                        day.querySelector('.time-selection').remove();
                    } else {
                        selectedDays.add(date);
                        showTimeSelection(day);
                    }
                });
            }
        });
    }

    function generateDays(year, month) {
        const daysHtml = [];
        const date = new Date(year, month, 1);

        while (date.getMonth() === month) {
            const day = date.getDate();
            const isoDate = date.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
            const dayOfWeek = date.getDay();
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domenica (0) o Sabato (6)
const isHoliday = italianHolidays.includes(isoDate);

            daysHtml.push(`
                <div class="calendar-day ${isHoliday || isWeekend ? 'holiday' : ''}" data-date="${isoDate}">
                    <span class="day">${day}</span>
                </div>
            `);
            date.setDate(date.getDate() + 1);
        }

        return daysHtml.join('');
    }

    function showTimeSelection(dayElement) {
        const timeSelectionHtml = `
            <div class="time-selection">
                <label><input type="checkbox" value="08:00-10:00"> 08:00-10:00</label><br>
                <label><input type="checkbox" value="10:00-12:00"> 10:00-12:00</label><br>
                <label><input type="checkbox" value="12:00-14:00"> 12:00-14:00</label><br>
            </div>`;
        dayElement.innerHTML += timeSelectionHtml;

        dayElement.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    window.prevMonth = function() {
        if (currentMonth === 8 && currentYear === today.getFullYear() - 1) return;
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        updateCalendar();
    };

    window.nextMonth = function() {
        if (currentMonth === 7 && currentYear === today.getFullYear()) return;
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        updateCalendar();
    };

    updateCalendar();
}

function confirmSelection() {
    const selectedDaysList = Array.from(selectedDays);
    const preferences = selectedDaysList.map(date => {
        const dayElement = document.querySelector(`.calendar-day[data-date="${date}"]`);
        const checkedTimes = Array.from(dayElement.querySelectorAll('.time-selection input:checked'))
            .map(input => input.value);
        return {
            date: date,
            time_slots: checkedTimes
        };
    });

    // Invio delle preferenze al server
    fetch('/save_preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: preferences })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
        } else {
            alert('Errore durante il salvataggio delle preferenze.');
        }
    })
    .catch(error => {
        console.error('Errore:', error);
    });
}