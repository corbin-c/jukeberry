const mm = require("music-metadata");
const getMetaTags = async (path) => {
  try {
    const allMetadata = (await mm.parseFile(path)).common;
    const metadata = {};
    const keys = ["title","year","label","genre","album","albumartist","composer","artist","picture"];
    keys.map(k => {
      if (allMetadata[k]
      && allMetadata[k] != ""
      && allMetadata[k] != "Unknown") {
        metadata[k] = allMetadata[k];
      }
    });
    if (!(metadata.title && metadata.album && metadata.artist)) {
      return {};
    }
    if (metadata.picture) {
      metadata.picture = metadata.picture.map(picture => {
        return `data:${picture.format};base64,${picture.data.toString('base64')}`;
      });
    }
    return {...metadata, path};
  } catch (e) {
    console.error(e);
    return {};
  }
}
const guessByPath = (path) => {
  let guesspath = path
    .replace(/_/g," ")
    .split("/");
  return {
    path,
    title: guesspath
      .slice(-1)[0]
      .split(".")
      .slice(0,-1)
      .join(".")
      .replace(/^\d+\s?-\s?/,""),
    album: guesspath.slice(-2)[0],
    artist: guesspath.slice(-3)[0], 
  }
}
const extractMetadata = async (path) => {
  const metadata = await getMetaTags(path);
  if (Object.keys(metadata).length > 0) {
    return metadata;
  }
  return guessByPath(path);
}
module.exports = extractMetadata;
