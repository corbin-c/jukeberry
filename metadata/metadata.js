const extract = require("./extractor.js");
const Fetcher = require("./fetcher.js");

class Metadata {
  constructor(parent) {
   this.fetcher = new Fetcher(parent.config);
   this.extract = extract;
   this.lastPath = "";
   this.lastResults = {};
  }
  resetPath() {
    this.lastPath = "";
    this.lastResults = {};
  }
  getMetadata(path) {
    if (path) {
      return this.extract(path);
    } else {
      return {};
    }
  }
  async fetch(metadata) {
    /* at this point metadata should at least look like this:
      {
        title: 'One of These Days',
        album: 'Meddle',
        artist: 'Pink Floyd'
      }
    */
    const path = metadata.path;
    let performer = metadata.artist;
    if (metadata.albumartist
      && metadata.albumartist.toLowerCase() !== metadata.artist.toLowerCase()) {
      performer = false;
    }
    const album = await this.fetcher.getAllMetadata({
      name: metadata.album,
      type: "release",
      performer
    });
    const artist = await this.fetcher.getAllMetadata({
      name: metadata.artist,
      type: "performer"
    });
    return {
      path,
      metadata,
      albumDetails: album,
      artistDetails: artist
    }
  }
  async consolidate(metadata) {
    const path = metadata.path;
    if (!path) {
      return {};
    }
    if (path === this.lastPath) {
      return this.lastResults;
    }
    this.lastPath = path;
    let allMetadata = await this.fetch(metadata);
    metadata = allMetadata.metadata;
    
    //~ cover
    if ((!metadata.picture)
      && (allMetadata.albumDetails.discogs.images.length)) {
      metadata.picture = allMetadata.albumDetails.discogs.images[0];
    } else if (allMetadata.artistDetails.discogs.images.length) {
      metadata.picture = allMetadata.artistDetails.discogs.images[0];
    } else if (allMetadata.artistDetails.wiki.image) {
      metadata.picture = allMetadata.artistDetails.wiki.image;
    }else {
      try {
        metadata.picture = metadata.picture[0];
      } catch {
        metadata.picture = false;
      }
    }
    
    //~ genres
    const genres = metadata.genre || [];
    metadata.genre = [...genres,
      ...allMetadata.albumDetails.discogs.genres,
      ...(allMetadata.artistDetails.genresLabels || "").split("|")]
      .map(e => e.toLowerCase());
    metadata.genre = [...new Set(metadata.genre)].filter(e => e);
    
    //~ year
    if (!metadata.year) {
      metadata.year = allMetadata.albumDetails.wiki.year || allMetadata.albumDetails.discogs.year;
    }
    
    //~ ARTIST DETAILS
    
    metadata.artistDetails = {
      wikiUrl: [],
      images: []
    }
    //~ Description
    if (allMetadata.artistDetails.discogs.description) {
      metadata.artistDetails.description = allMetadata.artistDetails.discogs.description
        .replace(/\r|\n|(\[\w{2,}=(.+?\]))|(\[\w+=*\]*)|\[\/*\w*\]|\]/g,"");
    }
    //~ Members
    if (allMetadata.artistDetails.wiki.membersLabels) {
      metadata.artistDetails.members = allMetadata.artistDetails.wiki.membersLabels.split("|");
    } else if (allMetadata.artistDetails.discogs.members) {
      metadata.artistDetails.members = allMetadata.artistDetails.discogs.members.map(e => {
        return e.name;
      });
    }
    //~ Occupations
    if (allMetadata.artistDetails.wiki.occupationLabels) {
      metadata.artistDetails.occupations = allMetadata.artistDetails.wiki.occupationLabels.split("|");
    }
    //~ Instruments
    if (allMetadata.artistDetails.wiki.instrumentsLabels) {
      metadata.artistDetails.instruments = allMetadata.artistDetails.wiki.instrumentsLabels.split("|");
    }
    //~ Country
    if (allMetadata.artistDetails.discogs.country) {
      metadata.artistDetails.country = allMetadata.artistDetails.discogs.country;
    }
    //~ Images
    if (allMetadata.artistDetails.wiki.image) {
      metadata.artistDetails.images.push(allMetadata.artistDetails.wiki.image);
    }
    if (allMetadata.artistDetails.discogs.images.length) {
      metadata.artistDetails.images = [
        ...metadata.artistDetails.images,
        ...allMetadata.artistDetails.discogs.images
      ];
    }
    //~ Dates
    if (allMetadata.artistDetails.wiki.startyear) {
      metadata.artistDetails.startYear = allMetadata.artistDetails.wiki.startyear;
    }
    if (allMetadata.artistDetails.wiki.endyear) {
      metadata.artistDetails.endYear = allMetadata.artistDetails.wiki.endyear;
    }
    if (allMetadata.artistDetails.wiki.birthyear) {
      metadata.artistDetails.birthYear = allMetadata.artistDetails.wiki.birthyear;
    }
    if (allMetadata.artistDetails.wiki.deathyear) {
      metadata.artistDetails.deathYear = allMetadata.artistDetails.wiki.deathyear;
    }
    if (allMetadata.artistDetails.wiki.birthplaceLabel) {
      metadata.artistDetails.birthPlace = allMetadata.artistDetails.wiki.birthplaceLabel;
    }
    //~ Wiki
    if (allMetadata.artistDetails.discogs.wiki) {
      metadata.artistDetails.wikiUrl.push(allMetadata.artistDetails.discogs.wiki);
    }
    if (allMetadata.artistDetails.wiki.wiki) {
      metadata.artistDetails.wikiUrl
        .push("https://en.wikipedia.org/wiki/"
          +allMetadata.artistDetails.wiki.wiki.replace(/ /g, "_"));
      metadata.artistDetails.wikiUrl = [...new Set(metadata.artistDetails.wikiUrl)];
    }
    
    //~ ALBUM DETAILS
    
    metadata.albumDetails = {
      wikiUrl: []
    };
    
    if (allMetadata.albumDetails.wiki.producerLabel) {
      metadata.albumDetails.producer = allMetadata.albumDetails.wiki.producerLabel;
    }
    if (allMetadata.albumDetails.wiki.studioLabel) {
      metadata.albumDetails.studio = allMetadata.albumDetails.wiki.studioLabel;
    }
    if (allMetadata.albumDetails.discogs.images.length) {
      metadata.albumDetails.images = allMetadata.albumDetails.discogs.images;
    }
    //~ Wiki
    if (allMetadata.albumDetails.discogs.wiki) {
      metadata.albumDetails.wikiUrl.push(allMetadata.albumDetails.discogs.wiki);
    }
    if (allMetadata.albumDetails.wiki.wiki) {
      metadata.albumDetails.wikiUrl
        .push("https://en.wikipedia.org/wiki/"
          +allMetadata.albumDetails.wiki.wiki.replace(/ /g, "_"));
      metadata.albumDetails.wikiUrl = [...new Set(metadata.albumDetails.wikiUrl)];
    }
    this.lastResults = { path, ...metadata };
    return { path, ...metadata };
  }
}
module.exports = Metadata;
