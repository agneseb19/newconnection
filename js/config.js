/* =========================================================
   DATI DEL NEGOZIO — qui si modificano telefono, email, social
   Tutto quello che lasci vuoto ('') viene nascosto dal sito.
   ========================================================= */
window.NC = {
  nome: 'New Connection',
  indirizzo: 'Via Molino San Giovanni 37, 00038 Valmontone (RM)',
  telefono: '+39 348 176 8071',
  whatsapp: '393481768071',   // solo numero con prefisso
  email: '',         // es. 'info@newconnection.it' (da inserire quando sarà attiva)

  // Quando i profili cambieranno nome, aggiorna solo questi due link
  instagram: 'https://www.instagram.com/reset.valmontonestore/',
  facebook: 'https://www.facebook.com/reset.valmontonestore',

  // Link alle recensioni Google del negozio
  recensioniGoogle: 'https://www.google.com/maps/search/?api=1&query=Reset+Valmontone+Store+Via+Molino+San+Giovanni+37+Valmontone',

  // Orari: 0 = domenica, 1 = lunedì ... 6 = sabato. Fasce in ore decimali.
  orari: {
    1: [[9.5, 13], [15.5, 19.5]],
    2: [[9.5, 13], [15.5, 19.5]],
    3: [[9.5, 13], [15.5, 19.5]],
    4: [[9.5, 13], [15.5, 19.5]],
    5: [[9.5, 13], [15.5, 19.5]],
    6: [[9.5, 13]],
    0: []
  },

  // Dati della società (footer)
  societa: 'NEW CONNECTION DI G&L SRL',
  sede: 'Via Casilina, 67 — 00038 Valmontone (RM)',
  piva: '17088051002',
  cf: '17088051002'
};
