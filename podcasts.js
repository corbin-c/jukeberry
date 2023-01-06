const { writeFileSync } = require("fs");

module.exports = class {
  constructor(parent) {
    this.parent = parent;
    try {
      this._list = require("./podcasts.json");
    } catch {
      console.warn("File './podcasts.json' couldn't be found... will create");
      this._list = [];
    }
  }
  get list() {
    return this._list;
  }
  set list(list) {
    this._list = list;
    writeFileSync("./podcasts.json",JSON.stringify(list));
  }
  create(name,url) {
    const newList = [...this._list, {
      name,
      url,
    }];
    this.list = newList;
  }
  removeRadio(url) {
    this.list = this._list.filter(e => e.url !== url);
  }
}
