const FEATURE = Object.freeze({
  PAUSE: 1, SEEK: 2, VOLUME_SET: 4, PREVIOUS: 16, NEXT: 32,
  PLAY: 16384, GROUPING: 524288,
});

export function hasFeature(player, flag) {
  return Boolean((Number(player?.attributes?.supported_features) || 0) & flag);
}

export function discoverPlayers(hass, config = {}) {
  const states = hass?.states || {};
  const registry = hass?.entities || {};
  const allowed = Array.isArray(config.entities) ? new Set(config.entities) : null;
  const excluded = new Set(config.exclude_entities || []);
  return Object.values(states)
    .filter((state) => state?.entity_id?.startsWith('media_player.') &&
      (state.attributes?.mass_player_type != null || registry[state.entity_id]?.platform === 'mass') &&
      (!allowed || allowed.has(state.entity_id)) && !excluded.has(state.entity_id))
    .sort((a, b) => (a.attributes?.friendly_name || a.entity_id)
      .localeCompare(b.attributes?.friendly_name || b.entity_id));
}

export function memberIds(player) {
  const members = player?.attributes?.group_members;
  return Array.isArray(members) ? members.filter((id) => typeof id === 'string') : [];
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function duration(seconds) {
  if (!Number.isFinite(Number(seconds))) return '0:00';
  const value = Math.max(0, Math.floor(Number(seconds)));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function artwork(player) {
  const url = player?.attributes?.entity_picture_local || player?.attributes?.entity_picture;
  return url ? `<img src="${escapeHtml(url)}" alt="" loading="lazy">` : '<span aria-hidden="true">♫</span>';
}

const CSS = `
  :host { display:block; color:#f9f8f8; font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
  * { box-sizing:border-box; }
  button,input { font:inherit; }
  button { cursor:pointer; }
  button:focus-visible,input:focus-visible { outline:2px solid #accbff; outline-offset:3px; }
  button:disabled { opacity:.38; cursor:default; }
  .tile { display:flex; width:100%; min-height:92px; align-items:center; gap:13px; padding:12px; border-radius:22px; border:1px solid #ffffff24; color:inherit; text-align:left; background:linear-gradient(110deg,#36332e,#23252b 70%,#191c23); box-shadow:0 9px 24px #0003; }
  .small-art,.art { display:grid; place-items:center; overflow:hidden; flex:none; background:radial-gradient(circle at 50% 18%,#e2ba83 0,transparent 34%),linear-gradient(145deg,#826b61,#30323d 74%); }
  .small-art { width:67px; height:67px; border-radius:14px; font-family:Georgia,serif; font-size:35px; }
  .small-art img,.art img { width:100%; height:100%; object-fit:cover; }
  .tile-copy { flex:1; min-width:0; }
  .tile-copy small,.tile-copy strong,.tile-copy span { display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .tile-copy small { color:#d0c9c7; font-size:11px; font-weight:750; margin-bottom:5px; }
  .tile-copy strong { font-size:15px; }
  .tile-copy span { color:#bbb7b8; font-size:12px; margin-top:4px; }
  .chevron { font-size:24px; color:#d5d1d1; }
  dialog { position:fixed; inset:0; width:min(100vw,440px); height:100dvh; max-width:none; max-height:none; margin:auto; padding:0; border:0; color:inherit; background:#16181d; overflow:auto; overscroll-behavior:contain; box-shadow:0 0 70px #0009; }
  dialog::backdrop { background:#000b; }
  .page { min-height:100%; padding:calc(18px + env(safe-area-inset-top)) 21px calc(24px + env(safe-area-inset-bottom)); }
  .player { background:radial-gradient(ellipse 110% 58% at 50% 16%,#72615c 0%,#373940 48%,transparent 100%),#16181d; }
  .top { display:flex; align-items:center; justify-content:space-between; min-height:45px; gap:10px; }
  .eyebrow { text-transform:uppercase; letter-spacing:.15em; font-size:10px; font-weight:800; color:#d2cbd0; text-align:center; }
  .icon { width:44px; height:44px; flex:none; border:0; border-radius:50%; background:#ffffff19; color:white; font-size:23px; display:grid; place-items:center; }
  .art { width:min(100%,350px); aspect-ratio:1; border-radius:15px; margin:32px auto 27px; box-shadow:0 25px 52px #0008; font-family:Georgia,serif; font-size:112px; }
  .track { display:flex; align-items:center; justify-content:space-between; gap:14px; }
  .track h2 { font-size:27px; letter-spacing:-.05em; margin:0; line-height:1.14; }
  .track p { font-size:15px; color:#c6c3c7; margin:6px 0 0; }
  .seek { margin-top:24px; }
  input[type=range] { width:100%; accent-color:#f0dfd7; touch-action:auto; }
  .times { display:flex; justify-content:space-between; font-size:11px; color:#c8c2c3; font-variant-numeric:tabular-nums; }
  .transport { display:flex; align-items:center; justify-content:center; gap:34px; margin:17px 0 23px; }
  .transport button { min-width:44px; height:52px; border:0; background:transparent; color:white; font-size:27px; }
  .transport .toggle { width:66px; height:66px; border-radius:50%; background:#f7f0eb; color:#25252b; font-size:29px; }
  .volume-line { display:flex; align-items:center; gap:12px; color:#ddd4d2; }
  .volume-line input { flex:1; }
  .actions { display:flex; gap:10px; margin-top:29px; }
  .pill { flex:1; min-height:54px; border-radius:18px; border:1px solid #ffffff2d; color:white; background:#ffffff1a; font-weight:750; }
  .pill.primary { color:#30272b; background:#f1e4dd; border-color:transparent; }
  .room-title { margin:30px 0 5px; font-size:28px; letter-spacing:-.05em; }
  .muted { color:#a9adba; font-size:13px; line-height:1.45; }
  .section { margin:27px 0 10px; color:#abb0bc; font-size:11px; letter-spacing:.14em; font-weight:800; text-transform:uppercase; }
  .room-row { display:grid; grid-template-columns:1fr auto; gap:7px 12px; align-items:center; border-bottom:1px solid #ffffff19; padding:13px 0; min-height:73px; }
  .room-row strong { font-size:14px; display:block; }
  .room-row small { font-size:11px; color:#9ca1ad; display:block; margin-top:4px; }
  .row-buttons { display:flex; gap:6px; align-items:center; }
  .row-buttons button { border-radius:99px; border:1px solid #ffffff2e; color:#f4eced; background:#ffffff12; padding:8px 11px; min-height:36px; font-size:11px; font-weight:700; }
  .row-buttons button.selected { background:#f1e4dd; border-color:#f1e4dd; color:#30272b; }
  .room-volume { grid-column:1 / -1; display:flex; align-items:center; gap:10px; font-size:11px; color:#c8c2c5; font-variant-numeric:tabular-nums; }
  .room-volume input { flex:1; min-height:30px; }
  .error { margin:14px 0 0; color:#ffbdad; font-size:12px; line-height:1.4; }
  .footnote { color:#999fac; font-size:11px; line-height:1.4; margin:20px 0 0; }
  [hidden] { display:none !important; }
  @media (max-width:350px) { .art { margin-top:20px; margin-bottom:20px; } .transport { gap:20px; } }
  @media (min-width:600px) { dialog { height:min(90dvh,850px); border-radius:26px; } }
`;

export class MaverickMusicCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._view = 'player';
    this._busy = false;
    this._error = '';
    this._initialized = false;
  }

  setConfig(config) {
    if (config.entities && (!Array.isArray(config.entities) || !config.entities.every((id) => typeof id === 'string'))) {
      throw new Error('entities must be a list of entity IDs');
    }
    if (config.exclude_entities && (!Array.isArray(config.exclude_entities) || !config.exclude_entities.every((id) => typeof id === 'string'))) {
      throw new Error('exclude_entities must be a list of entity IDs');
    }
    this._config = config;
    this._selectedId = config.entity || this._selectedId;
    this._render();
  }

  set hass(value) {
    this._hass = value;
    this._render();
  }

  getCardSize() { return 2; }
  static getStubConfig() { return {}; }

  connectedCallback() { this._render(); }

  _init() {
    if (this._initialized) return;
    this.shadowRoot.innerHTML = `<style>${CSS}</style><button type="button" class="tile" data-action="open"></button><dialog aria-label="MaverickMusic player"><div id="content"></div></dialog>`;
    this._dialog = this.shadowRoot.querySelector('dialog');
    this._dialog.addEventListener('close', () => { this._view = 'player'; this._error = ''; });
    this.shadowRoot.addEventListener('click', (event) => this._click(event));
    this.shadowRoot.addEventListener('change', (event) => this._change(event));
    this.shadowRoot.addEventListener('input', (event) => {
      if (event.target.matches('[data-action="room-volume"]')) {
        event.target.parentElement.querySelector('output').value = `${event.target.value}%`;
      }
    });
    this._initialized = true;
  }

  _players() { return discoverPlayers(this._hass, this._config); }

  _selected(players) {
    const current = players.find((p) => p.entity_id === this._selectedId);
    if (current) return current;
    const player = players.find((p) => p.entity_id === this._config.entity) ||
      players.find((p) => p.state === 'playing') || players[0];
    this._selectedId = player?.entity_id;
    return player;
  }

  _render() {
    if (!this.isConnected) return;
    this._init();
    const players = this._players();
    const player = this._selected(players);
    const tile = this.shadowRoot.querySelector('.tile');
    if (!player) {
      tile.innerHTML = `<span class="small-art" aria-hidden="true">♫</span><span class="tile-copy"><small>${escapeHtml(this._config.title || 'MUSIC')}</small><strong>No Music Assistant players</strong><span>Check the HA integration or card configuration</span></span>`;
      tile.disabled = true;
      if (this._dialog.open) this._dialog.close();
      return;
    }
    tile.disabled = false;
    const a = player.attributes || {};
    const title = a.media_title || (player.state === 'off' ? 'Ready to play' : 'Nothing playing');
    const artist = a.media_artist || (player.state === 'playing' ? 'Music Assistant' : 'Choose music in Music Assistant');
    const name = a.friendly_name || player.entity_id;
    tile.innerHTML = `<span class="small-art">${artwork(player)}</span><span class="tile-copy"><small>${escapeHtml(name)}</small><strong>${escapeHtml(title)}</strong><span>${escapeHtml(artist)}</span></span><span class="chevron" aria-hidden="true">›</span>`;
    if (!this._dialog.open) return;
    const scrollPosition = this._dialog.scrollTop;
    this.shadowRoot.querySelector('#content').innerHTML = this._view === 'rooms'
      ? this._rooms(players, player) : this._player(player);
    this._dialog.scrollTop = scrollPosition;
  }

  _player(player) {
    const a = player.attributes || {};
    const name = a.friendly_name || player.entity_id;
    const position = Math.max(0, Number(a.media_position) || 0);
    const length = Math.max(0, Number(a.media_duration) || 0);
    const volume = Math.round((Number(a.volume_level) || 0) * 100);
    const playing = player.state === 'playing';
    return `<div class="page player">
      <div class="top"><button class="icon" data-action="close" aria-label="Close player">⌄</button><span class="eyebrow">${escapeHtml(name)}</span><button class="icon" data-action="rooms" aria-label="Speaker controls">♫</button></div>
      <div class="art">${artwork(player)}</div>
      <div class="track"><div><h2>${escapeHtml(a.media_title || 'Ready to play')}</h2><p>${escapeHtml(a.media_artist || name)}${a.media_album_name ? ` · ${escapeHtml(a.media_album_name)}` : ''}</p></div></div>
      <div class="seek"><input type="range" min="0" max="${Math.max(1, Math.floor(length))}" value="${Math.min(position, length || 1)}" data-action="seek" aria-label="Playback position" ${!length || !hasFeature(player, FEATURE.SEEK) ? 'disabled' : ''}><div class="times"><span>${duration(position)}</span><span>${duration(length)}</span></div></div>
      <div class="transport"><button data-action="previous" aria-label="Previous track" ${!hasFeature(player, FEATURE.PREVIOUS) ? 'disabled' : ''}>⏮</button><button class="toggle" data-action="toggle" aria-label="${playing ? 'Pause' : 'Play'}" ${!hasFeature(player, playing ? FEATURE.PAUSE : FEATURE.PLAY) ? 'disabled' : ''}>${playing ? 'Ⅱ' : '▶'}</button><button data-action="next" aria-label="Next track" ${!hasFeature(player, FEATURE.NEXT) ? 'disabled' : ''}>⏭</button></div>
      <label class="volume-line"><span aria-hidden="true">◖</span><input type="range" min="0" max="100" value="${volume}" data-action="volume" aria-label="${escapeHtml(name)} volume" ${!hasFeature(player, FEATURE.VOLUME_SET) ? 'disabled' : ''}><span aria-hidden="true">◖))</span></label>
      <div class="actions"><button class="pill primary" data-action="rooms">Speakers</button></div>
      ${this._error ? `<p class="error" role="alert">${escapeHtml(this._error)}</p>` : ''}
    </div>`;
  }

  _rooms(players, leader) {
    const grouped = new Set(memberIds(leader));
    const canJoin = hasFeature(leader, FEATURE.GROUPING);
    return `<div class="page"><div class="top"><button class="icon" data-action="player" aria-label="Back to player">‹</button><span class="eyebrow">Whole home audio</span><button class="icon" data-action="close" aria-label="Close player">×</button></div>
      <h2 class="room-title">Speakers</h2><p class="muted">Choose your player and adjust room volumes.</p>
      <h3 class="section">Your players</h3>
      ${players.map((room) => {
        const id = escapeHtml(room.entity_id);
        const name = escapeHtml(room.attributes?.friendly_name || room.entity_id);
        const selected = room.entity_id === leader.entity_id;
        const member = grouped.has(room.entity_id);
        const unavailable = room.state === 'unavailable' || room.state === 'unknown';
        const vol = Math.round((Number(room.attributes?.volume_level) || 0) * 100);
        return `<div class="room-row"><div><strong>${name}</strong><small>${selected ? 'Selected player' : member ? 'Joined to selected player' : unavailable ? 'Unavailable' : room.state === 'playing' ? 'Playing' : 'Ready'}</small></div>
          <div class="row-buttons"><button data-action="select" data-id="${id}" class="${selected ? 'selected' : ''}" aria-label="Control ${name}" ${selected ? 'disabled' : ''}>${selected ? 'Selected' : 'Control'}</button>
          ${!selected && (canJoin || member) ? `<button data-action="${member ? 'unjoin' : 'join'}" data-id="${id}" aria-label="${member ? 'Remove' : 'Join'} ${name}" ${this._busy || unavailable ? 'disabled' : ''}>${member ? 'Remove' : 'Join'}</button>` : ''}</div>
          ${hasFeature(room, FEATURE.VOLUME_SET) && !unavailable ? `<label class="room-volume">Volume <input type="range" min="0" max="100" value="${vol}" data-action="room-volume" data-id="${id}" aria-label="${name} volume"><output>${vol}%</output></label>` : ''}
        </div>`;
      }).join('')}
      ${!canJoin ? '<p class="footnote">This player does not offer live grouping through Home Assistant. You can still select another player or adjust its volume.</p>' : '<p class="footnote">Music Assistant decides which players can join. Some combinations may be unavailable even when Join appears.</p>'}
      ${this._error ? `<p class="error" role="alert">${escapeHtml(this._error)}</p>` : ''}
    </div>`;
  }

  async _service(service, data) {
    if (this._busy || !this._hass) return;
    this._busy = true;
    this._error = '';
    try { await this._hass.callService('media_player', service, data); }
    catch (error) { this._error = error?.message || 'Music Assistant could not complete that action.'; }
    finally { this._busy = false; this._render(); }
  }

  _click(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || !this.shadowRoot.contains(button)) return;
    const action = button.dataset.action;
    if (action === 'open') { this._view = 'player'; this._dialog.showModal(); this._render(); return; }
    if (action === 'close') { this._dialog.close(); return; }
    if (action === 'rooms' || action === 'player') { this._view = action; this._error = ''; this._render(); return; }
    if (action === 'select') { this._selectedId = button.dataset.id; this._view = 'player'; this._render(); return; }
    const player = this._selected(this._players());
    if (!player) return;
    const id = player.entity_id;
    if (action === 'toggle') this._service(player.state === 'playing' ? 'media_pause' : 'media_play', { entity_id:id });
    if (action === 'previous' || action === 'next') this._service(action === 'previous' ? 'media_previous_track' : 'media_next_track', { entity_id:id });
    if (action === 'join' && hasFeature(player, FEATURE.GROUPING)) this._service('join', { entity_id:id, group_members:[button.dataset.id] });
    if (action === 'unjoin' && memberIds(player).includes(button.dataset.id)) this._service('unjoin', { entity_id:button.dataset.id });
  }

  _change(event) {
    const input = event.target;
    if (!input.matches('input[data-action]')) return;
    const player = this._selected(this._players());
    if (!player) return;
    const action = input.dataset.action;
    if (action === 'seek' && hasFeature(player, FEATURE.SEEK)) this._service('media_seek', { entity_id:player.entity_id, seek_position:Number(input.value) });
    if (action === 'volume' && hasFeature(player, FEATURE.VOLUME_SET)) this._service('volume_set', { entity_id:player.entity_id, volume_level:Number(input.value) / 100 });
    if (action === 'room-volume') {
      const room = this._players().find((p) => p.entity_id === input.dataset.id);
      if (hasFeature(room, FEATURE.VOLUME_SET)) this._service('volume_set', { entity_id:room.entity_id, volume_level:Number(input.value) / 100 });
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('maverick-music-card')) {
  customElements.define('maverick-music-card', MaverickMusicCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type:'maverick-music-card', name:'MaverickMusic', description:'Mobile-first Music Assistant controls' });
}
