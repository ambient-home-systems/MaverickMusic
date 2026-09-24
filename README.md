# MaverickMusic

[![Add to Home Assistant](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ambient-home-systems&repository=MaverickMusic&category=plugin)

A mobile-first Home Assistant dashboard card for Music Assistant. It combines a compact dashboard tile with an artwork-led player and room controls. English is the primary interface language.

## Install with HACS

1. Install [HACS](https://www.hacs.xyz/docs/use/download/download/) and connect the Music Assistant integration to Home Assistant. Confirm its players appear as `media_player` entities.
2. Click **Add to Home Assistant** above. This opens the MaverickMusic repository in HACS; add it as a custom **Dashboard** repository if prompted, then choose **Download**. The button opens HACS and does not silently install the card.
3. Refresh Home Assistant after HACS downloads the card. Create a **Panel** view on a dedicated music dashboard, choose **Add card → MaverickMusic**, and configure the card in the visual editor. The full dashboard layout is the default. If you prefer YAML, use:

   ```yaml
   type: custom:maverick-music-card
   layout: full
   ```

The full layout is the default. It opens directly in the dashboard, fills the available width, and is sized for a phone screen. A Panel view gives the card the full dashboard width. To keep the compact tile and popup on another dashboard, set `layout: popup`. The Home Assistant navigation header remains part of the dashboard.

## Visual settings

In your dashboard, choose **Edit dashboard → edit the MaverickMusic card**. The graphical editor offers:

- **Display style:** full dashboard or compact tile with popup.
- **Starting player:** automatic selection or a particular Music Assistant speaker.
- **Player visibility:** all players or a checklist of players to show in the speaker controls.
- **Tile heading:** an optional label for the compact tile.
- **Advanced → Music Assistant instance ID:** only needed if Find music cannot detect the integration instance.

Your existing YAML remains valid; the editor keeps unrelated configuration keys when you change a setting. A dedicated Panel view is configured at the dashboard view level, outside the card editor.

Use **Find music** to browse favorite albums and playlists, or search Music Assistant tracks, albums, artists, playlists, radio, audiobooks, and podcasts. Tap ▶ to replace the current queue and play, or ＋ to play next. The library loads when you open Find music and is cached for that card session. The card uses the Music Assistant integration through Home Assistant and needs no separate Music Assistant browser token. It normally reads the Music Assistant instance ID from the selected player's entity registry entry. If the search view says the ID is unavailable, add `config_entry_id: YOUR_MUSIC_ASSISTANT_ENTRY_ID` to the card. Find that ID in the Music Assistant integration's action editor by selecting your instance and switching the action to YAML.

HACS normally registers the dashboard resource for you. If the card does not appear after refreshing, check **Settings → Dashboards → Resources** for `/hacsfiles/MaverickMusic/MaverickMusic.js` (JavaScript module). This is a HACS resource check; there is no manual file installation path.

Already installed an older version? In **HACS → MaverickMusic → ⋮**, choose **Update information** and then **Redownload**. Refresh the Home Assistant app or browser afterward. Version **0.6.0** shows a `v0.6.0` label beside MaverickMusic in the full card or beside the room name in the compact tile. If you still see an older version, check **Settings → Dashboards → Resources** for `/hacsfiles/MaverickMusic/MaverickMusic.js`, and refresh the app's frontend cache.

Optionally select the starting player or restrict the available players:

```yaml
type: custom:maverick-music-card
entity: media_player.living_room
entities:
  - media_player.living_room
  - media_player.kitchen
  - media_player.deck_speakers
```

`entities` limits the card to that list. `exclude_entities` hides particular entities from automatic discovery. Use the Music Assistant entities created by the integration, rather than similarly named native Sonos or Cast entities.

## Current features

- Automatically finds Music Assistant `media_player` entities exposed to Home Assistant.
- Displays live title, artist, artwork, playback state, progress, and volume.
- Controls play, pause, previous, next, seek, and volume when the selected entity supports them.
- Switches the controlled player and shows per-room volume sliders.
- Shows a compact **Playing now** speaker list at the bottom of the full card; tap a speaker to control it.
- Browses favorite albums and playlists, searches connected Music Assistant providers, and plays or queues a result from the card.
- Offers temporary join/unjoin actions when the selected player advertises Home Assistant's `GROUPING` feature. Music Assistant may still reject a particular pairing; the card reports the error.

To join speakers, first select the speaker that should keep the music queue with **Control**, then tap **Join** on the speaker that should follow it. The card sends Home Assistant's `media_player.join` action to the selected speaker, waits for its `group_members` state to confirm the join, and shows an error if Home Assistant does not confirm it within 15 seconds. Speakers on different Music Assistant instances cannot be joined. Music Assistant also requires compatible sync capable players; its [grouping guide](https://www.music-assistant.io/faq/groups/) explains supported combinations. If a pairing still fails, try the same leader and member in **Home Assistant → Developer tools → Actions → Join media players** and check the Music Assistant server logs for the specific reason.

The full card batches Home Assistant state updates into animation frames and updates progress and volume controls in place. While you drag a volume slider, its position follows your finger without being overwritten by delayed speaker state updates. The card sends the final value when you let go, or after a short pause for keyboard changes. If the speaker does not confirm the setting, its reported volume returns after a few seconds.

This is an early working card. Full library navigation, queue editing, transfer, favorite management, and persistent group management are future work. It does not require HOMEii Flow or a Music Assistant API token in the browser.

## Development

The installable file is `MaverickMusic.js` in the repository root, as declared in `hacs.json`. There is no build step or runtime dependency. Run `npm test` for the model tests, then test playback and grouping on a Home Assistant instance with Music Assistant.

## Privacy

This public repo contains no Home Assistant URL, access token, private entity export, or household configuration. The example room names are illustrative.
