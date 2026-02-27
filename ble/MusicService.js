const bleno = require("bleno");
const CommandCharacteristic = require("./CommandCharacteristic");
const StatusCharacteristic = require("./StatusCharacteristic");

const SERVICE_UUID = "bf27730d-860a-4e09-889c-2d8b6a9e0fe7";

class MusicService extends bleno.PrimaryService {
  constructor() {
    this.commandCharacteristic = new CommandCharacteristic();
    this.statusCharacteristic = new StatusCharacteristic();
    super({
      uuid: SERVICE_UUID,
      characteristics: [
        this.commandCharacteristic,
        this.statusCharacteristic
      ]
    });
  }

  notifyStatus(status) {
    this.statusCharacteristic.updateStatus(status);
  }
}

module.exports = MusicService;
