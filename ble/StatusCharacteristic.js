const bleno = require("bleno");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const STATUS_UUID = "bf27730f-860a-4e09-889c-2d8b6a9e0fe7";

class StatusCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: STATUS_UUID,
      properties: ["read", "notify"],
      value: null
    });
    this._updateValueCallback = null;
    this._currentStatus = Buffer.from(JSON.stringify({ state: "stopped" }));
    this._lastStatusObj = {};
    global.statusCharacteristic = this;
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log("[BLE] Watch subscribed to status notifications");
    this._updateValueCallback = updateValueCallback;
  }

  onUnsubscribe() {
    console.log("[BLE] Watch unsubscribed from status notifications");
    this._updateValueCallback = null;
  }

  onReadRequest(offset, callback) {
    callback(this.RESULT_SUCCESS, this._currentStatus.slice(offset));
  }

  updateStatus(status) {
    this._lastStatusObj = status;
    const bleStatus = {
      playing: !!status.playing,
      state: status.playing ? (status.playing.paused ? "paused" : "playing") : "stopped",
      track: "Unknown",
      artist: "Unknown",
      position: 0,
      duration: 0,
      cover: ""
    };

    if (status.playing && status.playing.metadata) {
      const meta = status.playing.metadata;
      bleStatus.track = meta.title || meta.name || bleStatus.track;
      bleStatus.artist = meta.artist || bleStatus.artist;
      if (meta.path) {
        // Use path as a unique ID for cover
        bleStatus.cover = Buffer.from(meta.path).toString("hex").slice(-12);
      }
    }

    this._currentStatus = Buffer.from(JSON.stringify(bleStatus));
    console.log(`[BLE] Status updated: ${this._currentStatus.toString()}`);

    if (this._updateValueCallback) {
      this._updateValueCallback(this._currentStatus);
      console.log("[BLE] Status notified");
    }
  }

  async sendCover(id) {
    if (!this._updateValueCallback) {
      console.warn("[BLE] Cannot send cover: No subscriber");
      return;
    }

    console.log(`[BLE] Starting cover transfer for ${id}`);
    
    let pictureData = null;
    if (this._lastStatusObj.playing && this._lastStatusObj.playing.metadata) {
      const meta = this._lastStatusObj.playing.metadata;
      if (meta.picture) {
        pictureData = meta.picture;
      }
    }

    if (!pictureData) {
      console.log("[BLE] No cover found to send");
      this.notifyJson({ type: "cover_end" });
      return;
    }

    try {
      this.notifyJson({ type: "cover_start" });

      let buffer;
      if (pictureData.startsWith("data:")) {
        const base64Data = pictureData.split(",")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else if (pictureData.startsWith("http")) {
        // We might want to download it, but for now let's skip to keep it simple
        // or just ignore if it's a URL
        console.log("[BLE] Cover is a URL, skipping download for now");
        this.notifyJson({ type: "cover_end" });
        return;
      }

      const tmpIn = path.join(os.tmpdir(), `jb_cover_in_${id}`);
      const tmpOut = path.join(os.tmpdir(), `jb_cover_out_${id}.jpg`);
      
      fs.writeFileSync(tmpIn, buffer);
      
      // Resize to max 480x480 and convert to JPG
      await new Promise((resolve, reject) => {
        exec(`convert "${tmpIn}" -resize 480x480 ">" "${tmpOut}"`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const resizedBuffer = fs.readFileSync(tmpOut);
      const base64Resized = resizedBuffer.toString("base64");
      
      // Chunking: 200 bytes per notification
      const chunkSize = 200;
      for (let i = 0; i < base64Resized.length; i += chunkSize) {
        const chunk = base64Resized.slice(i, i + chunkSize);
        this.notifyJson({ type: "cover_chunk", chunk: chunk });
        // Small delay to avoid overwhelming the BLE stack
        await new Promise(r => setTimeout(r, 20));
      }

      this.notifyJson({ type: "cover_end" });
      console.log("[BLE] Cover transfer finished");

      // Cleanup
      fs.unlinkSync(tmpIn);
      fs.unlinkSync(tmpOut);
    } catch (e) {
      console.error(`[BLE] Error during cover transfer: ${e.message}`);
      this.notifyJson({ type: "cover_end" });
    }
  }

  notifyJson(obj) {
    if (this._updateValueCallback) {
      const data = Buffer.from(JSON.stringify(obj));
      this._updateValueCallback(data);
    }
  }
}

module.exports = StatusCharacteristic;
