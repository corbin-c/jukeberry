const bleno = require("bleno");
const MusicService = require("./MusicService");

const SERVICE_UUID = "bf27730d-860a-4e09-889c-2d8b6a9e0fe7";
const DEVICE_NAME = "JukeBerry";

const musicService = new MusicService();

function startBle() {
  bleno.on("stateChange", (state) => {
    console.log(`[BLE] stateChange: ${state}`);
    if (state === "poweredOn") {
      bleno.startAdvertising(DEVICE_NAME, [SERVICE_UUID]);
    } else {
      bleno.stopAdvertising();
    }
  });

  bleno.on("advertisingStart", (error) => {
    console.log(`[BLE] advertisingStart: ${error ? "error " + error : "success"}`);
    if (!error) {
      bleno.setServices([musicService], (error) => {
        console.log(`[BLE] setServices: ${error ? "error " + error : "success"}`);
      });
      console.log("[BLE] Advertising started");
    }
  });

  bleno.on("accept", (clientAddress) => {
    console.log(`[BLE] Watch connected: ${clientAddress}`);
  });

  bleno.on("disconnect", (clientAddress) => {
    console.log(`[BLE] Watch disconnected: ${clientAddress}`);
  });
}

module.exports = { startBle, musicService };
