const config = require("./config.json");
const { Gpio } = require("./import.js")(config.gpio);

const GPIO = class {
  constructor(config, gpio) {
    this.config = config;
    this.Gpio = gpio;
    this.blinking = {};
    this.leds = {};
    this.buttons = {};
    this.config.leds.forEach(e => {
      if (this.Gpio !== false) {
        this.leds[e.name] = new this.Gpio(e.port, "out");
        this["led-"+e.name] = {
          on: () => {
            this.leds[e.name].writeSync(1);
          },
          off: () => {
            this.leds[e.name].writeSync(0);
          },
          blink: (t) => {
            if ((typeof this.blinking[e.name] !== "undefined")
              && (this.blinking[e.name] !== false)) {
              console.log(e.name, "already blinking");
              return;
            }
            this.blinking[e.name] = setInterval(() => {
              if (this.leds[e.name].readSync() === 0) {
                this.leds[e.name].writeSync(1);
              } else {
                this.leds[e.name].writeSync(0);
              }              
            }, t);
          },
          endBlink: () => {
            clearInterval(this.blinking[e.name]);
            this.leds[e.name].writeSync(0);
            this.blinking[e.name] = false;
          }
        }
      } else {
        this["led-"+e.name] = {
          on: () => {},
          off: () => {},
          blink: () => {},
          endBlink: () => {},
        }
      }
    });
    this.config.buttons.forEach(e => {
      if (this.Gpio !== false) {
        this.buttons[e.name] = new this.Gpio(e.port, "in", "both");
        this["btn-"+e.name] = {
          pushCallback: () => {},
          releaseCallback: () => {},
          onPush: (callback) => {
            this["btn-"+e.name].pushCallback = callback;
          },
          onRelease: (callback) => {
            this["btn-"+e.name].releaseCallback = callback;
          }
        };
        this.buttons[e.name].watch((error,value) => {
          if (error) {
            console.error(error);
            return;
          }
          if (value === 1) {
            this["btn-"+e.name].pushCallback();
          } else {
            this["btn-"+e.name].releaseCallback();
          }
        });
      } else {
        this["btn-"+e.name] = {
          pushCallback: () => {},
          releaseCallback: () => {},
          onPush: () => {},
          onRelease: () => {}
        }
      }
    });
    if (this.Gpio !== false) {
      process.on("SIGINT", () => {
        Object.values(this.buttons).forEach(e => {
          e.unexport();
        });
        Object.values(this.leds).forEach(e => {
          e.writeSync(0);
          e.unexport();
        });
      });
    }
  }
}

module.exports = new GPIO(config, Gpio);
