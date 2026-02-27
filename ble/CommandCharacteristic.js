const bleno = require("bleno");
const fetch = require("node-fetch");
const { exec } = require("child_process");

const COMMAND_UUID = "bf27730e-860a-4e09-889c-2d8b6a9e0fe7";

class CommandCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: COMMAND_UUID,
      properties: ["write"],
      value: null
    });
  }

  async onWriteRequest(data, offset, withoutResponse, callback) {
    const payload = data.toString("utf8");
    console.log(`[BLE] Command received: ${payload}`);

    try {
      const json = JSON.parse(payload);
      const action = json.action || json.command; // Support both formats

      if (!action) {
        console.error("[BLE] No action provided in payload");
        callback(this.RESULT_SUCCESS);
        return;
      }

      await this.handleAction(action, json);
      callback(this.RESULT_SUCCESS);
    } catch (e) {
      console.error(`[BLE] Error parsing command: ${e.message}`);
      // Also try raw string if JSON parsing fails (for simple commands)
      await this.handleAction(payload.trim(), {});
      callback(this.RESULT_SUCCESS);
    }
  }

  async handleAction(action, json) {
    const port = 5000; // Default port from main.js
    const baseUrl = `http://localhost:${port}/api`;

    switch (action) {
      case "play":
      case "pause":
        // Check current state to decide if we need to toggle
        try {
          const statusRes = await fetch(`${baseUrl}/status`);
          const status = await statusRes.json();
          const isPlaying = !!status.playing;
          const isPaused = status.playing && status.playing.paused;

          if (action === "play") {
            if (!isPlaying) {
              // If not playing at all, start playing music list
              await fetch(`${baseUrl}/media/play/music`, {
                method: "POST",
                body: JSON.stringify({ random: true }),
                headers: { "Content-Type": "application/json" }
              });
            } else if (isPaused) {
              await this.sendMediaCommand("togglePlay");
            }
          } else if (action === "pause") {
            if (isPlaying && !isPaused) {
              await this.sendMediaCommand("togglePlay");
            }
          }
        } catch (e) {
          console.error(`[BLE] Error during play/pause handling: ${e.message}`);
        }
        break;

      case "togglePlay":
        await this.sendMediaCommand("togglePlay");
        break;

      case "next":
        await this.sendMediaCommand("next");
        break;

      case "prev":
        await this.sendMediaCommand("prev");
        break;

      case "stop":
        await fetch(`${baseUrl}/media/stop`, { method: "POST" });
        break;

      case "volume_up":
        exec("amixer set Master 5%+");
        break;

      case "volume_down":
        exec("amixer set Master 5%-");
        break;

      case "volume":
        if (typeof json.value !== "undefined") {
          exec(`amixer set Master ${json.value}%`);
        }
        break;

      case "shuffle":
        await fetch(`${baseUrl}/media/play/music`, {
          method: "POST",
          body: JSON.stringify({ random: true }),
          headers: { "Content-Type": "application/json" }
        });
        break;

      case "get_cover":
        // To be implemented in StatusCharacteristic or separate logic
        console.log(`[BLE] get_cover requested for ID: ${json.value || json.id}`);
        // This will trigger a notification sequence from StatusCharacteristic
        if (global.statusCharacteristic) {
          global.statusCharacteristic.sendCover(json.value || json.id);
        }
        break;

      default:
        console.warn(`[BLE] Unknown action: ${action}`);
    }
  }

  async sendMediaCommand(command) {
    const port = 5000;
    try {
      await fetch(`http://localhost:${port}/api/media/command`, {
        method: "POST",
        body: JSON.stringify({ command }),
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      console.error(`[BLE] Error sending media command ${command}: ${e.message}`);
    }
  }
}

module.exports = CommandCharacteristic;
