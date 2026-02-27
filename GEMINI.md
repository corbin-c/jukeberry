# JukeBerry BLE Extension

This extension adds a BLE GATT layer to JukeBerry, allowing control and status monitoring from a ZeppOS watch app.

## Implementation Details

- **BLE Service UUID**: `bf27730d-860a-4e09-889c-2d8b6a9e0fe7`
- **Command Characteristic UUID**: `bf27730e-860a-4e09-889c-2d8b6a9e0fe7` (Write)
- **Status Characteristic UUID**: `bf27730f-860a-4e09-889c-2d8b6a9e0fe7` (Read/Notify)

### Files Created/Modified

- `/ble/bleServer.js`: Main BLE initialization and event handling.
- `/ble/MusicService.js`: GATT Service definition.
- `/ble/CommandCharacteristic.js`: Handles writes from the watch, translating them into internal REST API calls.
- `/ble/StatusCharacteristic.js`: Pushes playback state updates and handles cover art transfer protocol.
- `jukeberry.js`: Modified to initialize BLE and hook into status changes.

### BLE Commands Supported

The Command Characteristic accepts JSON payloads:

- `{"action": "play"}`: Resumes playback or starts random music if stopped.
- `{"action": "pause"}`: Pauses current playback.
- `{"action": "next"}`: Next track.
- `{"action": "prev"}`: Previous track.
- `{"action": "volume_up"}`: Increases system volume (via `amixer`).
- `{"action": "volume_down"}`: Decreases system volume (via `amixer`).
- `{"action": "volume", "value": 70}`: Sets system volume to 70%.
- `{"action": "shuffle"}`: Restarts music in shuffle mode.
- `{"action": "get_cover", "id": "..."}`: Initiates a chunked transfer of the current track's cover art.

### Status Notifications

The Status Characteristic sends JSON updates:

```json
{
  "playing": true,
  "state": "playing",
  "track": "Track Title",
  "artist": "Artist Name",
  "position": 0,
  "duration": 0,
  "cover": "hex_id"
}
```

## Setup Requirements

1. **Permissions**: Node requires capabilities to access BLE without root:
   ```bash
   sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
   ```
2. **Dependencies**: `bleno` must be installed.
3. **System**: Bluetooth service must be active.

## Known Issues / Limitations

- **npm 403**: Some private dependencies in `package.json` caused installation failures during development. `bleno` was added to `package.json` but might need manual installation if the registry issue persists.
- **Cover Art**: Currently supports covers embedded in files as Base64 data URIs. External URLs are skipped to avoid blocking.
