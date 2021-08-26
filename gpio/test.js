const gpio = require("./gpio.js");

const wait = (t) => {
  return new Promise((resolve,reject) => {
    setTimeout(() => {
      resolve();
    },t);
  });
}
const alternateBlink = async () => {
  gpio["led-green"].blink(300);
  await wait(155);
  gpio["led-yellow"].blink(300);  
}
gpio["btn-push-red"].onPush(() => {
  alternateBlink();
});
gpio["btn-push-green"].onPush(() => {
  gpio["led-green"].endBlink();
  gpio["led-yellow"].endBlink();
});
gpio["btn-push-green"].onRelease(() => {
  console.log("release green");
});
