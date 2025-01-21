from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
import os

# Creazione dell'app Flask
app = Flask(__name__)

# Chiave segreta per la gestione delle sessioni
app.secret_key = 'OrarioOttimo'

# Percorso del database
DATABASE = 'OrarioOttimo.db'

# Funzione per connettersi al database
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DATABASE):
        with get_db() as db:
            # Creazione della tabella utenti
            db.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    cognome TEXT NOT NULL,
                    data_nascita DATE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    ruolo TEXT NOT NULL,
                    materia TEXT
                )
            ''')

            # Inserimento di un utente amministratore
            db.execute('''
                INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', ('Mattia', 'Overa', 'ma.overa@gmail.com', 'Carfora', '2000-03-10', 'amministratore'))

            # Creazione della tabella preferenze
            db.execute('''
                CREATE TABLE IF NOT EXISTS preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time_slots TEXT NOT NULL
                )
            ''')

            # Creazione della tabella segnalazioni
            db.execute('''
                CREATE TABLE IF NOT EXISTS segnalazioni (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    testo TEXT NOT NULL,
                    data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Creazione della tabella valutazioni
            db.execute('''
                CREATE TABLE IF NOT EXISTS valutazioni (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    testo TEXT NOT NULL,
                    voto INTEGER NOT NULL,
                    data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            db.execute('''
                        CREATE TABLE IF NOT EXISTS notifications (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            message TEXT NOT NULL,
                            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    ''')

            print("Database e tabelle creati con successo!")


            # Inserimento dati nella tabella utenti
            #matematicamente parlando essendo che le ore scolastiche vengono divise equamente tra i docenti risulterà che per ogni 3 docenti si può occupare in modo corretto le lezioni per una classe.

            db.execute('''
                INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', ('Alessandro', 'Farina', 'alefarina@gmail.com', 'Farina00', '2002-03-16', 'docente', 'matematica'))

            db.execute('''
                INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', ('Luca', 'Benedetto', 'lukebene@gmail.com', 'sonoBenedetto', '2003-06-21', 'docente', 'inglese'))

            db.execute('''
                            INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', ('Giovanni', 'Verga', 'gioverga@gmail.com', 'Malavoglia', '1992-09-02', 'docente', 'italiano'))

            db.execute('''
                                        INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ''', ('Alberto', 'Angela', 'alberto_angela@gmail.com', 'Odissea', '1962-04-08', 'docente', 'storia'))

            db.execute('''
                                        INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ''', ('Paolo', 'Cannavaro', 'cannavaro06@gmail.com', 'FootballSSC', '1981-06-26', 'docente', 'educazione fisica'))

            db.execute('''
                                        INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ''', ('Vincenzo', 'Schettini', 'lafisicachecipiace@gmail.com', 'Love-Fisica', '1977-03-07', 'docente', 'fisica'))

            db.execute('''
                                        INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ''', ('Roberto', 'Bomba', 'RobertoJ@gmail.com', 'Oppenheimer', '1967-02-18', 'docente', 'scienze'))

            db.execute('''
                                        INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ''', ('Alberto', 'Cancelli', 'cancelli55@mgail.com', 'Cancelli_55', '1955-10-28', 'docente', 'informatica'))

            db.execute('''
                                        INSERT INTO users (nome, cognome, email, password, data_nascita, ruolo, materia)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ''', ('Ludovica', 'Bronzo', 'ludobronzo@gmail.com', 'CU', '1980-09-09', 'docente', 'economia'))
            db.commit()
            print("Database e tabelle creati con successo!")

# Rotte
@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        with get_db() as db:
            user = db.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password)).fetchone()

            if user:
                session['nome'] = user['nome']
                session['cognome'] = user['cognome']
                session['user_id'] = user['id']
                session['email'] = user['email']
                session['ruolo'] = user['ruolo']
                session['materia'] = user['materia']

                # Reindirizzamento in base al ruolo
                if user['ruolo'] == 'amministratore':
                    return redirect(url_for('amministratore'))
                else:
                    return redirect(url_for('docente'))

        return redirect(url_for('login'))

    return render_template('Login.html')

@app.route('/docente')
def docente():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    user_data = {
        'nome': session.get('nome'),
        'cognome': session.get('cognome'),
        'email': session.get('email'),
        'materia': session.get('materia')
    }

    return render_template('Docente.html', user_data=user_data)

@app.route('/amministratore')
def amministratore():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    user_data = {
        'nome': session.get('nome'),
        'cognome': session.get('cognome'),
        'email': session.get('email')
    }

    return render_template('Amministratore.html', user_data=user_data)

@app.route('/save_preferences', methods=['POST'])
def save_preferences():
    if 'user_id' not in session:
        return {"status": "error", "message": "Utente non autenticato"}

    email = session.get('email')

    data = request.get_json()
    selected_preferences = data.get('preferences', [])

    with get_db() as db:
        # Rimuove le vecchie preferenze per l'utente
        db.execute('DELETE FROM preferences WHERE email = ?', (email,))

        # Inserisce le nuove preferenze
        for preference in selected_preferences:
            db.execute('INSERT INTO preferences (email, date, time_slots) VALUES (?, ?, ?)',
                       (email, preference['date'], ', '.join(preference['time_slots'])))

        db.commit()

    # Aggiungi la notifica per l'amministratore
    docente = f"{session.get('nome')} {session.get('cognome')}"
    message = f"Nuove preferenze salvate da {docente}."

    try:
        with get_db() as db:
            db.execute('''
                INSERT INTO notifications (message) VALUES (?)
            ''', (message,))
            db.commit()

        return {"status": "success", "message": "Preferenze salvate con successo!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.route('/submit_segnalazione', methods=['POST'])
def submit_segnalazione():
    if 'user_id' not in session:
        return {"status": "error", "message": "Utente non autenticato"}

    email = session.get('email')
    data = request.get_json()
    testo = data.get('segnalazione', '').strip()

    if not testo:
        return {"status": "error", "message": "Il testo della segnalazione è vuoto"}

    try:
        with get_db() as db:
            db.execute('''
                INSERT INTO segnalazioni (email, testo) VALUES (?, ?)
            ''', (email, testo))
            db.commit()

        # Dopo il commit della segnalazione, aggiungi la notifica per l'amministratore
        with get_db() as db:
            # Recupera l'email dell'amministratore
            amministratore = db.execute('SELECT email FROM users WHERE ruolo = ?', ('amministratore',)).fetchone()

            if amministratore:
                # Crea il messaggio della notifica
                message = f"Nuova segnalazione da {session.get('nome')} {session.get('cognome')}: '{testo}'."
                # Aggiungi la notifica nel database
                db.execute('''
                    INSERT INTO notifications (message) VALUES (?)
                ''', (message,))
                db.commit()

        return {"status": "success", "message": "Segnalazione salvata con successo!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Rotta per recuperare i docenti
@app.route('/get_docenti', methods=['GET'])
def get_docenti():
    if 'user_id' not in session:
        return {"status": "error", "message": "Utente non autenticato"}

    with get_db() as db:
        docenti = db.execute('SELECT nome, cognome, email, materia FROM users WHERE ruolo = ?', ('docente',)).fetchall()

    return {"status": "success", "docenti": [dict(row) for row in docenti]}

# Rotta per recuperare le preferenze
@app.route('/get_preferenze', methods=['GET'])
def get_preferenze():
    if 'user_id' not in session:
        return {"status": "error", "message": "Utente non autenticato"}

    with get_db() as db:
        preferenze = db.execute('SELECT * FROM preferences').fetchall()

    return {"status": "success", "preferenze": [dict(row) for row in preferenze]}

@app.route('/submit_valutazione', methods=['POST'])
def submit_valutazione():
    if 'user_id' not in session:
        return {"status": "error", "message": "Utente non autenticato"}

    email = session.get('email')
    data = request.get_json()
    voto = data.get('voto')
    testo = data.get('testo', '').strip()

    if not voto or not testo:
        return {"status": "error", "message": "Compila tutti i campi prima di inviare."}

    try:
        with get_db() as db:
            # Inserisci la valutazione
            db.execute('''
                INSERT INTO valutazioni (email, voto, testo) VALUES (?, ?, ?)
            ''', (email, voto, testo))
            db.commit()

            # Aggiungi la notifica
            docente = f"{session.get('nome')} {session.get('cognome')}"
            message = f"Nuova valutazione da {docente}: '{testo}' con voto {voto}."
            db.execute('''
                INSERT INTO notifications (message) VALUES (?)
            ''', (message,))
            db.commit()

        return {"status": "success", "message": "Valutazione salvata con successo!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.route('/orario_generato')
def orario_generato():
    if 'orario' not in session:
        return "Nessun orario disponibile. Genera l'orario prima."

    orario = session['orario']  # Recupera l'orario generato dalla sessione
    return render_template('OrarioGenerato.html', orario=orario)

@app.route('/get_valutazioni', methods=['GET'])
def get_valutazioni():
    if 'user_id' not in session:
        return {"status": "error", "message": "Utente non autenticato"}

    with get_db() as db:
        valutazioni = db.execute('SELECT * FROM valutazioni').fetchall()

    return {"status": "success", "valutazioni": [dict(row) for row in valutazioni]}

@app.route('/get_notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session or session.get('ruolo') != 'amministratore':
         return {"status": "error", "message": "Pagina caricata non correttamente"}

    with get_db() as db:
        notifications = db.execute('SELECT * FROM notifications ORDER BY date DESC').fetchall()

    return {"status": "success", "notifications": [dict(row) for row in notifications]}

# Inizializzazione del database all'avvio
init_db()

if __name__ == '__main__':
    app.run(debug=True)