# New Connection — sito web

## Come aprirlo (passo passo)
1. Apri Visual Studio Code → menu **File → Apri cartella…** → scegli la cartella `newconnection` sulla Scrivania.
2. Apri il file `index.html` dal pannello a sinistra.
3. In basso a destra clicca **Go Live** (se non lo vedi: pannello Estensioni → cerca "Live Server" → Installa).
4. Si apre il browser con il sito. Ogni volta che salvi un file, la pagina si aggiorna da sola.

⚠️ **Usa sempre Go Live.** Se apri `index.html` con il doppio clic, il browser blocca i modelli 3D: il sito mostra i testi ma non le animazioni (e compare un avviso).

## ✅ DA FARE (aggiornato all'11 novembre 2026)

**Prima di andare online**
- [ ] **Email** → `js/config.js`, voce `email`.
- [x] **Promo PC** → HP EliteBook 840 G5 a 299 €, dall'apertura al 31 dicembre. Dal 1° gennaio la card sparisce da sola (data in `index.html`, attributo `data-promo-until`). Nell'ultima settimana mostra "Ultimi N giorni!".
- [ ] **Foto del negozio** → la sezione in home ("Il negozio") è pronta, con 5 riquadri. Metti le foto in `assets/negozio/` con questi nomi: `negozio-1.jpg` (la grande: il negozio), `negozio-2.jpg` (vetrina), `negozio-3.jpg` (banco), `negozio-4.jpg` (laboratorio), `negozio-5.jpg` (prodotti). Ogni foto che aggiungi prende il posto del suo riquadro, senza toccare il codice. Meglio foto orizzontali, larghe circa 1600 px.
- [x] **Promo iPhone (nuovi)** → iPhone 18 Pro 256 GB a 1.350 € e 18 Pro Max 256 GB a 1.550 €, fino al 31 dicembre (si nasconde da sola il 1° gennaio). L'immagine `assets/promo/iphone-18-pro-promo.webp` è disegnata da noi col modello 3D del sito, con schermate di blocco sugli sfondi di iPhone 18 forniti da New Connection (scelta della cliente, 12/11/2026).
- [ ] **Privacy e cookie con iubenda** → incollare il banner cookie di iubenda nel `<head>` di tutte le pagine e i link "Privacy" e "Cookie" nel footer. In iubenda dichiarare: **Google Maps** (mappa incorporata) e **Google Fonts** (font Outfit).
- [x] **Anteprima social** → immagine `assets/og-image.jpg` e tag già inseriti nelle 4 pagine; icona per la Home dell'iPhone `assets/apple-touch-icon.png`.
- [ ] **Dominio definitivo** → appena è deciso: rendere completo l'indirizzo dell'immagine di anteprima (`og:image`) e aggiungere `og:url`; creare `robots.txt` e `sitemap.xml`.
- [ ] **Google Search Console** → dopo la pubblicazione: registrare il sito e inviare la sitemap (Claude ti spiega i passaggi).
- [ ] **Pubblicazione su SiteGround** → caricare l'intera cartella (comprese `js/vendor` e `assets/models`), tranne `node_modules`, `tests` e i file `.md`.

**Dopo, fuori dal sito — NON DIMENTICARE**
- [ ] **Scheda Google "Reset Valmontone Store"** → rinominarla in New Connection, cambiare l'indirizzo in **Via Molino San Giovanni 37** (oggi è ancora Via della Pace 1/2, presso Fashion Hotel) e aggiungere il link al nuovo sito. Poi aggiornare `recensioniGoogle` in `js/config.js`.
- [ ] **Profilo WhatsApp Business (348 176 8071)** → oggi si presenta come "Reset Valmontone Store" con il logo Reset: cambiare nome, foto profilo (logo New Connection) e descrizione nell'app WhatsApp Business.
- [ ] **Instagram e Facebook** → dopo il cambio nome, se cambia il nome utente (`reset.valmontonestore`) aggiornare i link `instagram` e `facebook` in `js/config.js`.

## Il sito attuale (14 ottobre, con i dati di Gianmarco)
Stile chiaro e arrotondato (vedi `DESIGN.md`). In home, nell'ordine (dall'11 novembre): iPhone 3D, barra con orario di oggi / indirizzo / telefono / WhatsApp, promo di apertura, chi siamo, il negozio (foto), recensioni, vieni a trovarci. Riparazioni e vendita sono solo nella pagina Servizi.
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
5. Aggiungi in `crediti-3d.html` il nome dell'autore e la licenza: con la licenza CC BY è obbligatorio.

## Dove modificare le cose
- `js/config.js` → telefono, WhatsApp, email, link Instagram e Facebook, orari. Quello che lasci vuoto viene nascosto.
- `js/reviews.js` → incolla qui le recensioni Google vere (c'è un esempio nel file).
- Promozioni → ora la sezione è nascosta. In `index.html` cerca `id="promozioni" hidden`, togli `hidden` e sostituisci `Promozione 1/2/3` con le offerte vere.
- **Importante:** in `js/config.js` inserisci telefono, WhatsApp ed email. Senza questi dati il modulo di assistenza non può inviare la richiesta e il pulsante "Chiama" resta nascosto.
- Foto di Gianmarco → `assets/gianmarco.png` (per cambiarla sostituisci quel file).
- Colore dell'iPhone 3D → in `js/nc3d.js` cerca `IPHONE_COLOR`.

## Crediti dei modelli 3D (obbligatori)
Sono nella pagina `crediti-3d.html`, collegata dal footer ("Crediti modelli 3D").
- iPhone: "Apple iPhone 15 Pro Max Black" di polyman, Sketchfab, licenza CC BY 4.0 (modificato).
- MacBook e Notebook: modelli di New Connection (`assets/models/macbook-new-connection.glb`, `notebook-new-connection.glb`).
- Se aggiungi un modello con licenza CC BY (es. PS5), scrivi autore e licenza in `crediti-3d.html`.

## Pubblicazione
Solo dopo aver controllato tutto con Go Live, carica online l'intera cartella (comprese `js/vendor` e `assets/models`).
