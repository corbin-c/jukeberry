class Jukebox {
  constructor() {}
  async getTree(path="./") {
    let tree = await fetch("./api?action=getTree&options="+path);
    tree = await tree.json();
    return tree;
  }
  play(path="./") {
    fetch("./api?action=playFile&options="+path);
  }
  playRandom(path="./") {
    fetch("./api?action=playRandom&options="+path);
  }
  stop() {
    fetch("./api?action=stop");
  }
  halt() {
    fetch("./api?action=halt");
  }
  async regenerate() {
    await fetch("./api?action=makeTree");
  }
  allRandom() {
    fetch("api?action=playAllRandom");
  }
}
let Jukeberry = new Jukebox();
export { Jukeberry };
