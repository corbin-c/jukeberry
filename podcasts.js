const Parser = new (require("rss-parser"))();
const { writeFileSync } = require("fs");

module.exports = class {
  constructor(parent) {
    this.parent = parent;
    try {
      this.list = require("./podcasts.json");
    } catch {
      console.warn("File './podcasts.json' couldn't be found... will create");
      this.list = [];
    }
  }
  save() {
    writeFileSync("./podcasts.json",JSON.stringify(this.list));
  }
  async create(url) {
    const podcast = (await this.updateFeed({
      url: url,
      hash: Buffer.from(url).toString("base64"))
      name: "",
      description: "",
      episodes: []
    })).feed;
    this.list = [...this.list,  podcast];
    this.save();
  }
  async update(url) {
    const podcastIndex = this.list.findIndex(e => e.url === url);
    const update = await this.updateFeed(this.list[podcastIndex]);
    if (update.changed) {
      this.list[podcastIndex] = update.feed;
      this.save();
    } else {
      console.log("no changes");
    }
  }
  async updateFeed(oldFeed) {
    const feed = await Parser.parseURL(oldFeed.url);
    let changed = false;
    if (feed.title !== oldFeed.name) {
      oldFeed.name = feed.title;
      changed = true;
    }
    if (feed.description !== oldFeed.description) {
      oldFeed.description = feed.description;
      changed = true;
    }
    console.log(oldFeed.episodes.length)
    if (feed.items
      .some(item => !oldFeed.episodes
        .find(e => e.url === item.enclosure?.url))) {
      oldFeed.episodes = feed.items.map(item => {
        return {
          title: item.title,
          date: item.isoDate || item.pubDate,
          description: item.contentSnippet || item.content,
          url: item.enclosure.url
        }
      });
      changed = true;
    }
    return { changed, feed: oldFeed };
  }
  remove(url) {
    this.list = this.list.filter(e => e.url !== url);
  }
}
