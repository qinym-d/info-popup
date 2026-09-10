import { buildFieldList } from './fields.js';

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
    width: 100%; max-width: 420px; border: 1px solid #E7E7E7;
    border-radius: 12px; padding: 24px; text-align: center;
    transform: translateY(8px); transition: transform .18s ease;
    outline: none;
  }
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
  .name { font-family: "Space Grotesk", sans-serif; font-size: 24px; font-weight: 600; margin: 0 0 16px; }
  .fields { text-align: left; margin: 0 0 16px; border-top: 1px solid #E7E7E7; }
  .field { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #E7E7E7; }
  .field dt { color: #6B7280; font-size: 13px; flex: 0 0 auto; }
  .field dd { margin: 0; font-size: 14px; text-align: right; }
  .profile { text-align: left; font-size: 14px; line-height: 1.6; margin: 0 0 16px; white-space: pre-wrap; }
  .id { position: absolute; right: 12px; bottom: 10px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: #9CA3AF; }
  @media (max-width: 639px) { .panel { max-width: none; border-radius: 0; } }
  @media (prefers-reduced-motion: reduce) { .backdrop, .panel { transition: none; } }
</style>
<div class="backdrop" hidden>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="info-popup-name" tabindex="-1">
    <button class="close" type="button" aria-label="关闭">×</button>
    <img class="photo" alt="" />
    <h2 class="name" id="info-popup-name"></h2>
    <dl class="fields"></dl>
    <p class="profile"></p>
    <span class="id"></span>
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
    this._name.textContent = data.name ?? '';
    this._photo.src = data.pic ?? '';
    this._photo.alt = data.name ?? '';

    this._fields.innerHTML = '';
    for (const { label, values } of buildFieldList(data)) {
      const row = document.createElement('div');
      row.className = 'field';
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = values.join(' / ');
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
