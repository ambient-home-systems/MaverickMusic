import { test } from 'node:test';
import { strict as assert } from 'node:assert';

globalThis.HTMLElement = class {};
const { discoverPlayers, hasFeature, memberIds, escapeHtml } = await import('../maverick-music-card.js');

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
