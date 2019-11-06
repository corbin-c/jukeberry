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
  stop() {
    fetch("./api?action=stop");
  }
}
let Jukeberry = new Jukebox();
export { Jukeberry };
