let isDashboardOpen = false;

function openClock() {
    const content = document.getElementById('content');

    if (!isDashboardOpen) {
        content.innerHTML = `
            <div class="clock-panel">
                <h2>Gestione Orario</h2>
                <div class="option">
                    <span>Recupera Docenti</span>
                    <button onclick="recuperaDocenti()">Apri</button>
                </div>
                <div class="option">
                    <span>Recupera Preferenze</span>
                    <button onclick="recuperaPreferenze()">Apri</button>
                </div>
                <div class="option">
                    <span>Numero Classi</span>
                    <input type="number" id="numeroClassiInput" placeholder="Inserisci numero classi">
                </div>
                <div class="option centrale">
                    <button onclick="preparaOrario()">Genera Orario</button>
                </div>
            </div>
        `;
        content.style.display = 'block';
        isDashboardOpen = true;
    } else {
        content.innerHTML = '';
        content.style.display = 'none';
        isDashboardOpen = false;
    }
}

function recuperaDocenti() {
    fetch('/get_docenti')
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                const output = data.docenti.map(docente => `Nome: ${docente.nome}\nCognome: ${docente.cognome}\nEmail: ${docente.email}\nMateria: ${docente.materia}\n----------`).join('\n');
                alert(output);
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(error => alert("Errore: " + error));
}

function recuperaPreferenze() {
    fetch('/get_preferenze')
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                const output = data.preferenze.map(preferenza => `Email: ${preferenza.email}\nData: ${preferenza.date}\nPreferenza: ${preferenza.time_slots}\n----------`).join('\n');
                alert(output);
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(error => alert("Errore: " + error));
}

function preparaOrario() {
    Promise.all([
        fetch('/get_docenti').then(res => res.json()),
        fetch('/get_preferenze').then(res => res.json())
    ])
    .then(([docentiData, preferenzeData]) => {
        if (docentiData.status !== "success" || preferenzeData.status !== "success") {
            alert("Errore nel recupero dei dati.");
            return;
        }

        const docenti = docentiData.docenti;
        const preferenze = preferenzeData.preferenze;

        // Giorni lavorativi esclusi sabato, domenica e festivi italiani
        const giorniFestivi = getItalianHolidays();
        const giorniLavorativi = getWorkingDays('2025-09-01', '2026-06-30', giorniFestivi); // le date inserite posso variare in base al periodo scolastico, quindi quando far iniziare e terminare le lezioni.

        // Recupera il numero di classi dall'input
        const numeroClassi = parseInt(document.getElementById('numeroClassiInput').value);

        // Distribuzione delle ore tra le classi
        const orario = distribuisciOrario(docenti, preferenze, giorniLavorativi, numeroClassi);

        // Mostra l'orario in formato tabella nella pagina
        mostraOrarioInTabella(orario);
    })
    .catch(error => alert("Errore: " + error));
}

// Funzione per ottenere i giorni festivi in Italia (inserendo sempre i ponti in base all'istituto)
function getItalianHolidays() {
    return [
        "01-11-2024", "25-12-2024", "26-12-2024",
    "01-01-2025", "06-01-2025", "25-04-2025",
    "01-05-2025", "02-06-2025" // etc.
    ];
}

const italianHolidays = [
    "01-11-2024", "25-12-2024", "26-12-2024",
    "01-01-2025", "06-01-2025", "25-04-2025",
    "01-05-2025", "02-06-2025"
];

function getWorkingDays() {
    // Partenza da settembre 2024 a giugno 2025 (modificabile in base ai periodi di lezione)
    const startDate = new Date(2024, 8, 1); // 1 settembre 2024
    const endDate = new Date(2025, 5, 30);  // 30 giugno 2025

    const workingDays = [];

    while (startDate <= endDate) {
        const dayOfWeek = startDate.getDay();
        const dateStr = formatDate(startDate);

        // Escludi sabato, domenica e giorni festivi
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !italianHolidays.includes(dateStr)) {
            workingDays.push(dateStr);
        }

        startDate.setDate(startDate.getDate() + 1);
    }

    return workingDays;
}

// Funzione per formattare la data in formato italiano (dd-mm-yyyy)
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Funzione per distribuire l'orario tra le classi
function distribuisciOrario(docenti, preferenze, giorniLavorativi, numeroClassi) {
    const orario = {};

    // Inizializza l'orario per ciascuna classe
    for (let i = 1; i <= numeroClassi; i++) {
        orario[`Classe ${i}`] = [];
    }

    // Assegna le lezioni giorno per giorno
    giorniLavorativi.forEach(giorno => {
        // Mescola casualmente i docenti per garantire equità
        const docentiMescolati = shuffleArray([...docenti]);

        // Per ogni classe, assegna fino a 3 lezioni al giorno
        for (let i = 1; i <= numeroClassi; i++) {
            const lezioniGiornaliere = [];

            while (lezioniGiornaliere.length < 3 && docentiMescolati.length > 0) {
                const docente = docentiMescolati.pop();

                // Recupera le preferenze del docente per il giorno in questione
                const preferenzeDocente = preferenze.filter(pref => pref.email === docente.email);

                // Verifica la disponibilità del docente per tutti gli slot orari
                const disponibile = preferenzeDocente.every(pref => {
                    const giornoPreferenza = pref.date; // Supponendo che pref.date sia già nel formato DD-MM-YYYY
                    const slotPreferiti = pref.time_slots || []; // Array di slot orari, es. ['8-10', '10-12', '12-14']

                    // Controlla che il docente sia disponibile per il giorno e per tutti gli slot richiesti
                    return giorno !== giornoPreferenza ||
                        (slotPreferiti.includes('8-10') && slotPreferiti.includes('10-12') && slotPreferiti.includes('12-14'));
                });

                if (disponibile) {
                    lezioniGiornaliere.push({
                        giorno,
                        docente: `${docente.nome} ${docente.cognome}`,
                        materia: docente.materia
                    });
                }
            }

            // Aggiungi le lezioni giornaliere all'orario della classe
            orario[`Classe ${i}`].push(...lezioniGiornaliere);
        }
    });

    return orario;
}

// Funzione per mescolare un array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Funzione per ottenere il nome del mese
function getMonthName(mese) {
    const mesi = [
        "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    return mesi[parseInt(mese, 10) - 1];
}

function mostraOrarioInTabella(orario) {
    const content = document.getElementById('content');
    let html = '<h2>Orario Generato</h2>';

    // Aggiungi il pulsante di download PDF
    html += '<button id="downloadPDF" style="margin: 20px; padding: 10px 20px; font-size: 16px;">Download PDF</button>';

    // Aggiungi stile per la tabella
    html += `
        <style>
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .mese-header { background-color: #d9edf7; padding: 10px; font-size: 18px; text-align: center; }
            .classe-header { background-color: #f7d9e8; padding: 10px; font-size: 20px; text-align: center; margin-top: 20px; }
        </style>
    `;

    for (const classe in orario) {
        html += `<div class="classe-header">${classe}</div>`;

        const lezioniPerMese = {};

        orario[classe].forEach(lezione => {
            const mese = lezione.giorno.split('-')[1];
            if (!lezioniPerMese[mese]) {
                lezioniPerMese[mese] = [];
            }
            lezioniPerMese[mese].push(lezione);
        });

        // Ordina i mesi da settembre a giugno
        const mesiOrdinati = ["09", "10", "11", "12", "01", "02", "03", "04", "05", "06"];

        // Per ogni mese ordinato, mostra le lezioni
        mesiOrdinati.forEach(mese => {
            if (lezioniPerMese[mese]) {
                const nomeMese = getMonthName(mese);
                html += `<div class="mese-header">${nomeMese}</div>`;
                html += `
                    <table>
                        <tr>
                            <th>Giorno</th><th>8-10</th><th>10-12</th><th>12-14</th>
                        </tr>
                `;

                lezioniPerMese[mese].forEach((lezione, index) => {
                    if (index % 3 === 0) html += '<tr><td>' + lezione.giorno + '</td>';
                    html += `<td>${lezione.docente} - ${lezione.materia}</td>`;
                    if ((index + 1) % 3 === 0) html += '</tr>';
                });

                html += '</table>';
            }
        });
    }

    content.innerHTML = html;
}