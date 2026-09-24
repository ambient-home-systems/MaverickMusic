# MaverickMusic

A mobile-first Home Assistant dashboard card for Music Assistant. It combines a compact dashboard tile with an artwork-led player and room controls. English is the primary interface language.

## First release

- Automatically finds Music Assistant `media_player` entities exposed to Home Assistant.
- Displays live title, artist, artwork, playback state, progress, and volume.
- Controls play, pause, previous, next, seek, and volume when the selected entity supports them.
- Switches the controlled player and shows per-room volume sliders.
- Offers temporary join/unjoin actions when the selected player advertises Home Assistant's `GROUPING` feature. Music Assistant may still reject a particular pairing; the card reports the error.

This is an early working card. Search, library browsing, queue editing, transfer, favorite state, and persistent group management are future work. It does not require HOMEii Flow or a Music Assistant API token in the browser.

## Install manually

1. Install and connect Music Assistant's Home Assistant integration. Confirm its players appear as `media_player` entities.
2. Copy `maverick-music-card.js` into `/config/www/maverick-music-card.js`.
3. In Home Assistant, go to **Settings → Dashboards → Resources** and add `/local/maverick-music-card.js` as a **JavaScript module**. Refresh the app or browser after changes.
4. Add a manual card to a dashboard:

   ```yaml
   type: custom:maverick-music-card
   ```

Optionally select the starting player or restrict the available players:

```yaml
type: custom:maverick-music-card
entity: media_player.living_room
entities:
  - media_player.living_room
  - media_player.kitchen
  - media_player.deck_speakers
title: Music
```

`entities` limits the card to that list, including the chosen `entity`. `exclude_entities` hides particular entities from automatic discovery. Use the Music Assistant entities created by the integration, rather than similarly named native Sonos or Cast entities.

## Development

There is no build step or runtime dependency. Run `npm test` for the model tests, then test playback and grouping on a Home Assistant instance with Music Assistant. The card relies on standard HA media-player services, the entity registry exposed to the frontend, and the `mass_player_type` attribute provided by the Music Assistant integration.

## Privacy

This public repo contains no Home Assistant URL, access token, private entity export, or household configuration. The example room names are illustrative.
