module.exports = (gpioNeeded) => {
  if (!gpioNeeded) {
    return {
      Gpio: false
    };
  }
  return require("onoff");
};
