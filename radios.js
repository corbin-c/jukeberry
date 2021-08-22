const { writeFileSync } = require("fs");

module.exports = class {
  constructor(parent) {
    this.parent = parent;
    try {
      this._list = require("./radios.json");
    } catch {
      console.warn("File './radios.json' couldn't be found... will create");
      this._list = [];
    }
  }
  get list() {
    return this._list.map(e => ({
      url: e.id,
      favorite: e.favorite,
      name: e.name
    }));
  }
  set list(list) {
    this._list = list;
    writeFileSync("./radios.json",JSON.stringify(list));
  }
  create(name,url,favorite=false) {
    const newList = [...this._list, {
      name,
      url,
      favorite: []
    }];
    this.list = newList;
  }
  removeRadio(url) {
    this.list = this._list.filter(e => e.url !== url);
  }
  toggleFavorite(url) {
    const targetRadio = this._list.find(e => e.url === url);
    const index = this._list.indexOf(targetRadio);
    targetRadio.favorite = !targetRadio.favorite;
    const newList = [...this._list];
    newList[index] = targetRadio;
    this.list = newList;
  }
}
