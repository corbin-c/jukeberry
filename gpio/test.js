const gpio = require("./gpio.js");

const wait = (t) => {
  return new Promise((resolve,reject) => {
    setTimeout(() => {
      resolve();
    },t);
  });
}
const alternateBlink = async () => {
  gpio["led-green"].blink(250);
  await wait(125);
  gpio["led-yellow"].blink(250);  
  await wait(5000);
  gpio["led-green"].endBlink();
  gpio["led-yellow"].endBlink();
}
alternateBlink();
gpio["push-red"].onPush(() => {
  console.log("push red");
});
gpio["push-green"].onPush(() => {
  console.log("push green");
});
gpio["push-green"].onRelease(() => {
  console.log("release green");
});
