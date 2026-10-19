/* =========================================================
   Modulo "Richiedi assistenza"
   1. il cliente compila il modulo
   2. sceglie come inviarlo: WhatsApp oppure email
   Numero ed email si cambiano in js/config.js.
   ========================================================= */
(function () {
  var form = document.getElementById('repairForm');
  if (!form) return;
  var note = document.getElementById('formNote');
  var choice = document.getElementById('sendChoice');
  var NC = window.NC || {};
  var testo = '';

  function message() {
    var d = new FormData(form);
    var nome = (d.get('nome') || '').trim(), tel = (d.get('tel') || '').trim();
    if (!nome || !tel) return null;
    return 'Ciao New Connection, sono ' + nome + ' (' + tel + ').\n' +
      'Dispositivo: ' + d.get('dev') + '\nProblema: ' + d.get('prob') +
      (d.get('msg') ? '\nMessaggio: ' + d.get('msg') : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    note.className = 'form-note';
    testo = message();
    if (!testo) { note.textContent = 'Inserisci almeno nome e telefono.'; form.querySelector(':invalid, input')?.focus(); return; }
    note.textContent = '';
    choice.hidden = false;
    void choice.offsetWidth; choice.classList.add('in');
    choice.querySelector('button:not([disabled])')?.focus();
  });

  var wa = choice.querySelector('[data-send="whatsapp"]');
  var em = choice.querySelector('[data-send="email"]');
  if (!NC.email) { em.disabled = true; em.querySelector('small').textContent = 'Indirizzo email in arrivo'; }

  wa.addEventListener('click', function () {
    if (!NC.whatsapp) return;
    window.open('https://wa.me/' + NC.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(testo), '_blank', 'noopener');
    note.className = 'form-note ok'; note.textContent = 'Si apre WhatsApp con la tua richiesta: premi invio per mandarla.';
  });
  em.addEventListener('click', function () {
    if (!NC.email) return;
    window.location.href = 'mailto:' + NC.email + '?subject=' + encodeURIComponent('Richiesta assistenza') + '&body=' + encodeURIComponent(testo);
    note.className = 'form-note ok'; note.textContent = 'Si apre la tua posta con la richiesta pronta da inviare.';
  });
})();
