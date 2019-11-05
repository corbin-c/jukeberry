class Jukebox {
  constructor() {}
  async getTree (path="./") {
    let tree = await fetch("./api?action=getTree&options="+path);
    tree = await tree.json();
    return tree;
  }
}
let Jukeberry = new Jukebox();
export { Jukeberry };
