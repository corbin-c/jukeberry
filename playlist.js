const { writeFileSync } = require("fs");

module.exports = class {
  constructor(parent) {
    this.parent = parent;
    try {
      this._list = require("./playlists.json");
    } catch {
      console.warn("File './playlists.json' couldn't be found... will create");
      this._list = [];
    }
  }
  get list() {
    return this._list.map(e => ({
      id: e.id,
      name: e.name
    }));
  }
  set list(list) {
    this._list = list;
    writeFileSync("./playlists.json",JSON.stringify(list));
  }
  getPlaylist(id) {
    return this._list.find(e => e.id === id).list;
  }
  create(name) {
    const id = Math.max(-1,...this._list.map(e => e.id))+1;
    const newList = [...this._list, {
      id,
      name,
      list: []
    }];
    this.list = newList;
    return id;
  }
  removePlaylist(id) {
    this.list = this._list.filter(e => e.id !== id);
  }
  add(id, path) {
    if (path === "CURRENT_MEDIA") {
      path = this.parent.status?.metadata?.path;
      if (!path?.length) {
        return;
      }
    }
    const targetPlaylist = this._list.find(e => e.id === id);
    if (targetPlaylist.list.includes(path)) {
      throw new Error("Cette chanson a déjà été ajoutée à la playlist");
    }
    const index = this._list.indexOf(targetPlaylist);
    targetPlaylist.list.push(path);
    const newList = [...this._list];
    newList[index] = targetPlaylist;
    this.list = newList;
  }
  removeSong(id, path) {
    const targetPlaylist = this._list.find(e => e.id === id);
    const index = this._list.indexOf(targetPlaylist);
    targetPlaylist.list = targetPlaylist.list.filter(e => e !== path);
    const newList = [...this._list];
    newList[index] = targetPlaylist;
    this.list = newList;
  }
  organize(id, path, position) {
    const changeItemPositionInArray = (oldIndex, newIndex, array) => {
      const targetElement = array[oldIndex];
      array = array.filter((e,i) => i !== oldIndex);
      array = [
        ...array.slice(0,newIndex),
        targetElement,
        ...array.slice(newIndex)
      ];
      return array;
    }
    const targetPlaylist = this._list.find(e => e.id === id);
    const index = this._list.indexOf(targetPlaylist);
    targetPlaylist.list = changeItemPositionInArray(
      targetPlaylist.list.indexOf(path),
      position,
      targetPlaylist.list
    );
    const newList = [...this._list];
    newList[index] = targetPlaylist;
    this.list = newList;
  }
}
