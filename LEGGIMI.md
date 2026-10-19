# New Connection — sito web

## Come aprirlo (passo passo)
1. Apri Visual Studio Code → menu **File → Apri cartella…** → scegli la cartella `newconnection` sulla Scrivania.
2. Apri il file `index.html` dal pannello a sinistra.
3. In basso a destra clicca **Go Live** (se non lo vedi: pannello Estensioni → cerca "Live Server" → Installa).
4. Si apre il browser con il sito. Ogni volta che salvi un file, la pagina si aggiorna da sola.

⚠️ **Usa sempre Go Live.** Se apri `index.html` con il doppio clic, il browser blocca i modelli 3D: il sito mostra i testi ma non le animazioni (e compare un avviso).

## Il sito attuale (14 ottobre, con i dati di Gianmarco)
Stile chiaro e arrotondato (vedi `DESIGN.md`). In home, nell'ordine: iPhone 3D, barra con orario di oggi / indirizzo / telefono / WhatsApp, riparazioni (schede Smartphone · Computer · Console), promo di apertura, vendita, prodotti 3D, chi siamo, recensioni, orari e contatti.
- Telefono e WhatsApp: 348 176 8071 (già inseriti in `js/config.js`).
- **Email:** quando Gianmarco attiva info@…, scrivila in `js/config.js` alla voce `email`: il pulsante "Email" del modulo si attiva da solo.
- **Promo di apertura:** in `index.html` cerca `Promo riparazioni`, `Promo smartphone`, `Promo computer` e scrivi le offerte vere al posto di "Presto i dettagli".
- **Recensioni:** copia 4–6 recensioni vere da Google in `js/reviews.js` (nome, stelle, testo, quando). Sul tuo computer (Go Live) vedi riquadri "Esempio" solo per l'impaginazione: online non compaiono mai. Il pulsante "Vedi tutte le recensioni su Google" usa il link `recensioniGoogle` in `js/config.js`: aggiornalo con la scheda Google di New Connection.
- Orari: lun–ven 9:30–13 e 15:30–19:30, sabato 9:30–13 (in `js/config.js` e nei testi delle pagine).
- Dati societari nel footer: New Connection di G&L Srl, Via Casilina 67, P. IVA e C.F. 17088051002.
- Vendita: iPhone sempre "usati / Open Box" (mai "ricondizionati"); ricondizionati solo i notebook.

## Cosa c'era di nuovo prima
- Navbar bianca con logo grande, link al centro, pulsante giorno/notte e "Richiedi assistenza".
- Modalità **giorno** (tutto bianco) e **notte** (tutto scuro): si cambia con l'icona tonda nella navbar e il sito se la ricorda.
- Home: iPhone 15 Pro Max vero che si scompone in esploso tecnico (schermo, scocca, scheda logica, batteria, USB-C, bobina MagSafe, vetro posteriore, fotocamere), con etichette.
- "Scegli. Esplora.": iPhone e MacBook sono modelli 3D veri; PS5 e TV sono ricostruiti da codice (PS5 con pannelli curvi, barra luminosa, porte e lettore; TV OLED sottile su piedistallo).
- Revisione del design (14 ottobre): via le etichette sopra i titoli, il testo a gradiente e i bagliori in eccesso; colori più leggibili; schede in tema notte corrette; sul telefono c'è una barra in basso con "Chiama" (compare quando inserisci il numero) e "Richiedi assistenza".
- Responsive: telefono, Pro Max, iPad, PC 13", 15" e schermi grandi.
- Tutte le librerie (Three.js, GSAP) sono dentro `js/vendor`: non serve internet per il 3D.

## PS5 e TV da file (facoltativo)
Da qui non ho potuto scaricarli: i modelli migliori sono su Sketchfab, che richiede un account gratuito.
1. Vai su sketchfab.com, accedi, cerca per esempio "Playstation 5 Digital Edition" (DatSketch) e una "Smart TV" con licenza **CC Attribution** e il pulsante **Download** gratuito.
2. Scarica il formato **glTF Binary (.glb)**.
3. Rinomina i file in `ps5.glb` e `tv.glb` e mettili nella cartella `assets/models`.
4. Ricarica la pagina: il sito li usa al posto di quelli costruiti da codice, senza toccare altro.
5. Aggiungi nel footer (file `build` o direttamente nei 4 HTML, riga "Modelli 3D") il nome dell'autore: con la licenza CC BY è obbligatorio.

## Dove modificare le cose
- `js/config.js` → telefono, WhatsApp, email, link Instagram e Facebook, orari. Quello che lasci vuoto viene nascosto.
- `js/reviews.js` → incolla qui le recensioni Google vere (c'è un esempio nel file).
- Promozioni → ora la sezione è nascosta. In `index.html` cerca `id="promozioni" hidden`, togli `hidden` e sostituisci `Promozione 1/2/3` con le offerte vere.
- **Importante:** in `js/config.js` inserisci telefono, WhatsApp ed email. Senza questi dati il modulo di assistenza non può inviare la richiesta e il pulsante "Chiama" resta nascosto.
- Foto di Gianmarco → in `index.html` cerca `gianmarco-latini.png`: ora è collegata al sito flashrepairstore.it. Meglio salvarla in `assets/` e cambiare il percorso.
- Colore dell'iPhone 3D → in `js/nc3d.js` cerca `IPHONE_COLOR`.

## Crediti dei modelli 3D (obbligatori, già nel footer)
- iPhone: "Apple iPhone 15 Pro Max Black" di polyman, Sketchfab, licenza CC BY 4.0 (colori modificati).
- MacBook: `mac-draco.glb` da pmndrs/examples, licenza MIT.

## Pubblicazione
Solo dopo aver controllato tutto con Go Live, carica online l'intera cartella (comprese `js/vendor` e `assets/models`).
