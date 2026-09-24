import { test } from 'node:test';
import { strict as assert } from 'node:assert';

globalThis.HTMLElement = class {};
const { discoverPlayers, hasFeature, memberIds, escapeHtml, searchItems,
  musicConfigEntry, MaverickMusicCard, MaverickMusicCardEditor } = await import('../MaverickMusic.js');

const mass = (id, extra = {}) => ({ entity_id: id, state:'playing', attributes:{ friendly_name:id, mass_player_type:'player', supported_features:524292, ...extra } });

test('discovers only Music Assistant players, with an optional allowlist', () => {
  const hass = { states: {
    'media_player.living': mass('media_player.living'),
    'media_player.legacy': { entity_id:'media_player.legacy', attributes:{} },
    'media_player.kitchen': { entity_id:'media_player.kitchen', attributes:{} },
  }, entities: { 'media_player.kitchen': { platform:'mass' }, 'media_player.legacy': { platform:'sonos' } } };
  assert.deepEqual(discoverPlayers(hass).map((x) => x.entity_id), ['media_player.kitchen','media_player.living']);
  assert.deepEqual(discoverPlayers(hass,{ entities:['media_player.living'] }).map((x) => x.entity_id), ['media_player.living']);
  assert.deepEqual(discoverPlayers(hass,{ exclude_entities:['media_player.living'] }).map((x) => x.entity_id), ['media_player.kitchen']);
});

test('grouping and volume are gated on actual entity features', () => {
  assert.equal(hasFeature(mass('media_player.living'), 524288), true);
  assert.equal(hasFeature(mass('media_player.living',{ supported_features:4 }), 524288), false);
  assert.equal(hasFeature(undefined, 4), false);
});

test('group members and dynamic text are handled safely', () => {
  assert.deepEqual(memberIds(mass('media_player.a',{ group_members:['media_player.b',null] })), ['media_player.b']);
  assert.deepEqual(memberIds(mass('media_player.a')), []);
  assert.equal(escapeHtml('<Living & "Room">'), '&lt;Living &amp; &quot;Room&quot;&gt;');
});

test('search uses the selected Music Assistant instance and returned URIs for playback', async () => {
  const player = mass('media_player.living');
  const calls = [];
  const card = Object.create(MaverickMusicCard.prototype);
  card._config = {};
  card._hass = {
    entities: { [player.entity_id]: { config_entry_id:'ma-entry' } },
    callService: async (...args) => {
      calls.push(args);
      return args[1] === 'search' ? { response: { tracks:[{ name:'Song', uri:'library://track/1' }] } } : {};
    },
  };
  card._selected = () => player;
  card._players = () => [player];
  card._render = () => {};
  card._searchResults = [];
  card._searchVersion = 0;
  assert.equal(musicConfigEntry(card._hass, player, card._config), 'ma-entry');
  await card._search(' Song ');
  assert.deepEqual(calls[0], ['music_assistant', 'search',
    { config_entry_id:'ma-entry', name:'Song', limit:8 }, undefined, false, true]);
  assert.deepEqual(searchItems({ response:{ tracks:[{ name:'Song', uri:'library://track/1' }] } })[0].media_type, 'track');
  assert.equal(card._searchResults.length, 1);
  await card._playResult(0, false);
  assert.deepEqual(calls[1], ['music_assistant', 'play_media',
    { media_id:'library://track/1', media_type:'track', enqueue:'replace' },
    { entity_id:'media_player.living' }]);
  assert.equal(card._view, 'player');
});

test('progress-only updates preserve the player DOM', () => {
  const player = mass('media_player.living', { media_title:'Song', media_position:5, media_duration:90 });
  const tile = { innerHTML:'', hidden:false };
  const inline = { innerHTML:'', hidden:false, querySelector:() => null };
  const card = Object.create(MaverickMusicCard.prototype);
  card.isConnected = true;
  card._initialized = true;
  card._config = { layout:'full' };
  card._hass = { states:{ [player.entity_id]:player } };
  card._view = 'player';
  card._error = '';
  card._searchResults = [];
  card._searching = false;
  card._searchQuery = '';
  card._dialog = { open:false };
  card.shadowRoot = { querySelector:(selector) => selector === '.tile' ? tile : inline, activeElement:null };
  card._render();
  const original = inline.innerHTML;
  Object.defineProperty(inline, 'innerHTML', { get:() => original, set:() => { throw new Error('progress rebuilt the DOM'); } });
  player.attributes.media_position = 6;
  card._render();
});

test('favorite library loads on demand and can play a playlist', async () => {
  const player = mass('media_player.living');
  const calls = [];
  const card = Object.create(MaverickMusicCard.prototype);
  card._config = {};
  card._hass = {
    entities: { [player.entity_id]: { config_entry_id:'ma-entry' } },
    callService: async (...args) => {
      calls.push(args);
      return args[1] === 'get_library' ? { response: { items:[{
        name:args[2].media_type === 'album' ? 'Album' : 'Playlist',
        uri:`library://${args[2].media_type}/1`,
      }] } } : {};
    },
  };
  card._selected = () => player;
  card._players = () => [player];
  card._render = () => {};
  card._libraryResults = [];
  card._libraryVersion = 0;
  await card._loadLibrary();
  assert.deepEqual(calls.slice(0, 2).map((call) => call[2]), [
    { config_entry_id:'ma-entry', media_type:'album', favorite:true, limit:12 },
    { config_entry_id:'ma-entry', media_type:'playlist', favorite:true, limit:12 },
  ]);
  await card._playResult(1, false, 'library');
  assert.equal(calls[2][2].media_id, 'library://playlist/1');
  assert.equal(calls[2][2].media_type, 'playlist');
});

test('visual editor emits card configuration while retaining advanced YAML fields', () => {
  const living = mass('media_player.living', { friendly_name:'Living room' });
  const kitchen = mass('media_player.kitchen', { friendly_name:'Kitchen' });
  const received = [];
  const editor = Object.create(MaverickMusicCardEditor.prototype);
  editor._config = { type:'custom:maverick-music-card', title:'Music', layout:'popup',
    config_entry_id:'ma-entry', exclude_entities:['media_player.kitchen'], custom_setting:'keep' };
  editor._hass = { states:{ [living.entity_id]:living, [kitchen.entity_id]:kitchen } };
  editor._render = () => {};
  editor.dispatchEvent = (event) => received.push(event);
  editor._change({ target:{ name:'layout', value:'full' } });
  assert.equal(received.at(-1).type, 'config-changed');
  assert.equal(received.at(-1).detail.config.layout, 'full');
  assert.equal(received.at(-1).detail.config.config_entry_id, 'ma-entry');
  assert.equal(received.at(-1).detail.config.custom_setting, 'keep');
  editor._change({ target:{ name:'visibility', value:'selected' } });
  assert.deepEqual(received.at(-1).detail.config.entities, ['media_player.living']);
  assert.equal('exclude_entities' in received.at(-1).detail.config, false);
  editor._textChanged({ name:'title', value:'Whole home music' });
  assert.equal(received.at(-1).detail.config.title, 'Whole home music');
  assert.deepEqual(MaverickMusicCard.prototype.getGridOptions.call({ _config:{ layout:'full' } }), { columns:'full' });
});
