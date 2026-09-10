import { normalizeInfo } from './fields.js';

const DEFAULT_ACCENT = '#E8F0FE';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: contents; }
  .backdrop {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0,0,0,0.32);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; opacity: 0; transition: opacity .18s ease;
  }
  .backdrop[hidden] { display: none; }
  .backdrop.open { opacity: 1; }
  .panel {
    position: relative; background: #FFFFFF; color: #0A0A0A;
    width: 100%; max-width: 460px; border: 1px solid #E7E7E7;
    border-radius: 12px; padding: 24px;
    display: flex; align-items: stretch;
    transform: translateY(8px); transition: transform .18s ease;
    outline: none;
  }
  .chain {
    flex: 0 0 92px; border-right: 1px solid #E7E7E7;
    margin-right: 16px; padding-right: 12px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .chain-item { display: flex; align-items: center; gap: 8px; position: relative; padding: 6px 0; }
  .chain-item:not(:last-child)::before {
    content: ''; position: absolute; left: 3px; top: 50%; bottom: -50%;
    width: 1px; background: #E7E7E7;
  }
  .chain-item .dot { width: 7px; height: 7px; border-radius: 50%; background: #C9D2DC; flex: 0 0 auto; position: relative; z-index: 1; }
  .chain-item.current .dot { background: var(--info-popup-accent); box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
  .chain-item .chain-label { font-size: 12px; color: #6B7280; line-height: 1.25; }
  .chain-item.current .chain-label { color: #0A0A0A; font-weight: 600; }
  .main { flex: 1; min-width: 0; text-align: center; }
  .backdrop.open .panel { transform: translateY(0); }
  .close {
    position: absolute; top: 12px; right: 12px; width: 32px; height: 32px;
    border: none; background: none; font-size: 20px; line-height: 1;
    color: #6B7280; cursor: pointer; border-radius: 50%;
  }
  .close:hover { background: #F3F4F6; }
  .close:focus-visible { outline: 2px solid var(--info-popup-accent); outline-offset: 2px; }
  .photo {
    width: 96px; height: 96px; border-radius: 50%; object-fit: cover;
    display: block; margin: 0 auto 12px; border: 3px solid var(--info-popup-accent);
  }
  .name { font-family: "Space Grotesk", sans-serif; font-size: 18px; font-weight: 600; margin: 0 0 16px; }
  .fields { display: inline-block; margin: 0 0 16px; }
  .field { display: grid; grid-template-columns: 1fr 1fr; align-items: center; width: 220px; padding: 4px 0; }
  .field dt { color: #9CA3AF; font-size: 12px; text-align: right; padding-right: 14px; }
  .field dd { margin: 0; font-size: 12px; color: #B0B6BF; display: flex; align-items: center; }
  .field dd::before { content: '|'; color: #E7E7E7; margin-right: 14px; }
  .profile { text-align: left; font-size: 14px; line-height: 1.6; margin: 0 0 16px; white-space: pre-wrap; }
  .id { position: absolute; right: 12px; bottom: 10px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: #9CA3AF; }
  @media (max-width: 639px) { .panel { max-width: none; border-radius: 0; } }
  @media (prefers-reduced-motion: reduce) { .backdrop, .panel { transition: none; } }
</style>
<div class="backdrop" hidden>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="info-popup-name" tabindex="-1">
    <button class="close" type="button" aria-label="关闭">×</button>
    <div class="chain" aria-label="从属链"></div>
    <div class="main">
      <img class="photo" alt="" />
      <h2 class="name" id="info-popup-name"></h2>
      <dl class="fields"></dl>
      <p class="profile"></p>
      <span class="id"></span>
    </div>
  </div>
</div>
`;

export class InfoPopup extends HTMLElement {
  static get observedAttributes() { return ['accent']; }

  constructor() {
    super();
    this._lastFocus = null;
    this._accent = DEFAULT_ACCENT;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));
    this._backdrop = this.shadowRoot.querySelector('.backdrop');
    this._panel = this.shadowRoot.querySelector('.panel');
    this._close = this.shadowRoot.querySelector('.close');
    this._photo = this.shadowRoot.querySelector('.photo');
    this._name = this.shadowRoot.querySelector('.name');
    this._chain = this.shadowRoot.querySelector('.chain');
    this._fields = this.shadowRoot.querySelector('.fields');
    this._profile = this.shadowRoot.querySelector('.profile');
    this._id = this.shadowRoot.querySelector('.id');
  }

  connectedCallback() {
    this._close.addEventListener('click', () => this.hide());
    this._backdrop.addEventListener('click', (e) => {
      if (e.target === this._backdrop) this.hide();
    });
    this.addEventListener('keydown', (e) => {
      if (this._backdrop.hidden) return;
      if (e.key === 'Escape') { this.hide(); return; }
      if (e.key === 'Tab') {
        const focusables = this._panel.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'accent') {
      this._accent = value || DEFAULT_ACCENT;
      this._applyAccent();
    }
  }

  get accent() { return this._accent; }

  _applyAccent() {
    this.style.setProperty('--info-popup-accent', this._accent);
  }

  show(nodeData, options = {}) {
    const accent = options.accent || this.getAttribute('accent') || DEFAULT_ACCENT;
    this._accent = accent;
    this._applyAccent();
    this._render(nodeData);
    this._lastFocus = document.activeElement;
    this._backdrop.hidden = false;
    requestAnimationFrame(() => this._backdrop.classList.add('open'));
    this.dispatchEvent(new CustomEvent('popup:open'));
    this._panel.focus();
  }

  hide() {
    if (this._backdrop.hidden) return;
    this._backdrop.classList.remove('open');
    const done = () => {
      this._backdrop.hidden = true;
      this.dispatchEvent(new CustomEvent('popup:close'));
      if (this._lastFocus && typeof this._lastFocus.focus === 'function') {
        this._lastFocus.focus();
      }
    };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) { done(); } else { setTimeout(done, 190); }
  }

  _render(data) {
    const chain = [...(Array.isArray(data.reportsTo) ? data.reportsTo : []), data.name].filter(Boolean);
    this._chain.innerHTML = '';
    chain.forEach((label, i) => {
      const item = document.createElement('div');
      item.className = 'chain-item' + (i === chain.length - 1 ? ' current' : '');
      const dot = document.createElement('span');
      dot.className = 'dot';
      const nameEl = document.createElement('span');
      nameEl.className = 'chain-label';
      nameEl.textContent = label;
      item.append(dot, nameEl);
      this._chain.append(item);
    });

    this._name.textContent = data.name ?? '';
    this._photo.src = data.pic ?? '';
    this._photo.alt = data.name ?? '';

    this._fields.innerHTML = '';
    for (const { type, value } of normalizeInfo(data.info)) {
      const row = document.createElement('div');
      row.className = 'field';
      const dt = document.createElement('dt');
      dt.textContent = type;
      const dd = document.createElement('dd');
      dd.textContent = value;
      row.append(dt, dd);
      this._fields.append(row);
    }

    this._profile.textContent = data.profile ?? '';
    this._id.textContent = data.id ?? '';
  }
}

if (typeof customElements !== 'undefined') {
  customElements.define('info-popup', InfoPopup);
}
