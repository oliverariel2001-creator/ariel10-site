// Ariel 10 — interações do site

// TODO: substituir pelo número oficial do WhatsApp comercial (somente dígitos, com DDI).
const WHATSAPP_NUMBER = '551140000000';

// Inicializa a fila do dataLayer: eventos disparados antes do GTM carregar ficam
// enfileirados e são processados quando (e se) o GTM for instalado.
window.dataLayer = window.dataLayer || [];

function getCampaignContext() {
  const params = new URLSearchParams(window.location.search);
  const values = ['utm_source', 'utm_medium', 'utm_campaign']
    .map((key) => params.get(key))
    .filter(Boolean);
  return values.length ? `Origem da campanha: ${values.join(' / ')}` : '';
}

function trackLead(source) {
  window.dataLayer.push({
    event: 'generate_lead',
    lead_channel: 'whatsapp',
    lead_source: source
  });
}

function openWhatsApp(message, source = 'desconhecido') {
  const campaignContext = getCampaignContext();
  const finalMessage = [message, campaignContext].filter(Boolean).join('\n');
  trackLead(source);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`, '_blank', 'noopener');
}

document.querySelectorAll('[data-whatsapp-message]').forEach((button) => {
  button.addEventListener('click', () => openWhatsApp(button.dataset.whatsappMessage, button.dataset.whatsappSource));
});

// Formulário comercial: monta a mensagem a partir dos names dos campos
// (independe da ordem no DOM) e valida o WhatsApp antes de abrir.
const form = document.querySelector('.form-manifest');
if (form) {
  const phoneInput = form.querySelector('#whatsapp');
  const statusEl = form.querySelector('.form-status');

  phoneInput.addEventListener('input', () => phoneInput.setCustomValidity(''));

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      phoneInput.setCustomValidity('Informe um WhatsApp válido com DDD, ex: (11) 91234-5678.');
      phoneInput.reportValidity();
      return;
    }

    const data = new FormData(form);
    const products = (data.get('produtos') || '').trim();
    const message = [
      'Olá! Quero falar com o comercial do Ariel 10.',
      `Nome: ${data.get('nome').trim()}`,
      `Empresa / CNPJ: ${data.get('empresa').trim()}`,
      `WhatsApp: ${data.get('whatsapp').trim()}`,
      `Cidade / UF: ${data.get('cidade').trim()}`,
      `Faixa de compra mensal: ${data.get('volume')}`,
      products && `Produtos que vendo hoje: ${products}`
    ].filter(Boolean).join('\n');

    openWhatsApp(message, 'formulario_comercial');
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = 'Abrindo o WhatsApp com seus dados — se não abrir, verifique o bloqueador de pop-ups.';
    }
  });
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const revealAll = () => revealEls.forEach((el) => el.classList.add('visible'));
if ('IntersectionObserver' in window) {
  let observerFired = false;
  const io = new IntersectionObserver((entries) => {
    observerFired = true;
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));
  // Alguns webviews expõem IntersectionObserver mas nunca disparam o callback;
  // sem este fallback o conteúdo ficaria permanentemente invisível (opacity 0).
  setTimeout(() => { if (!observerFired) revealAll(); }, 1500);
} else {
  revealAll();
}

// Mobile menu
const header = document.querySelector('header');
const menuToggle = document.querySelector('.menu-toggle');

if (header && menuToggle) {
  const closeMenu = () => {
    header.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });
  document.querySelectorAll('#primary-nav a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
}
