const getQuery = require("./sparql.js");
const fetch = require("node-fetch");
const userAgent = "JukeberryMetadata/1.0 +https://github.com/corbin-c/jukeberry";

class MetadataFetcher {
  constructor(config) {
    this.discogsToken = config.discogsToken;
  }
  async discogs(options) {
    const defaultResult = {
      images: [],
      description: false,
      members: [],
      name: false,
      id: false,
      country: false,
      year: false,
      genres: [],
      wiki: false
    }
    const {
      name,
      type,
      release,
      performer
    } = options;
    const id = options.discogsId || options.id;
    let url = "https://api.discogs.com/";
    if (id) {
      if (release) {
        url += "releases/";
      } else {
        url += (type == "performer") ? "artists/" : "masters/";
      }
      url += id + "?";
    } else {
      // /database/search?q={query}&{?type,title,release_title,credit,artist,anv,label,genre,style,country,year,format,catno,barcode,track,submitter,contributor}
      url += "/database/search?q="
        +((type == "release" && performer) ? performer+" - "+name : name)
        +"&type="
        +((type == "performer") ? "artist" : "master")
        +"&"
    }
    url = url += "token="+this.discogsToken+"&per_page=1"
    url = await fetch(url, { headers: { "User-Agent": userAgent } });
    url = await url.json();
    if (!id) {
      if (url.results.length == 0) {
        return defaultResult;
      }
      return this.discogs({...options, id: url.results[0].id});
    }
    const results = {};
    results.images = url.images.map(e => e.uri);
    results.description = url.profile;
    results.members = url.members;
    results.name = url.title || url.name;
    results.id = url.id;
    results.country = url.country;
    results.year = url.released || url.year;
    results.genres = url.styles || [];
    if (url.genres) {
      results.genres = [...results.genres, ...url.genres];
    }
    if (type == "release"
    && !results.name.toLowerCase().includes(name.toLowerCase())) {
      if (!release) {
        return this.discogs({...options, release: true});
      }
      return defaultResult;
    }
    if (url.urls) {
      results.wiki = url.urls.find(e => e.includes("wikipedia.org"));
    }
    return results;
  }
  async musicbrainz(options) {
    const {
      name,
      type,
      performer
    } = options;
    const id = options.musicbrainzId;
    let url = "https://musicbrainz.org/ws/2/";
    if (id) {
      url += (type == "performer") ? "artist" : "release";
      url += "/"+id+"?";
    }
    url += "fmt=json";
    console.log(url);
    url = await fetch(url, { headers: { "User-Agent": userAgent } });
    url = await url.json();
    console.log(url);
  }
  async wikiDataSPARQL(options,showQuery) {
    const defaultResult = {
      isLabel: false,
      birthplaceLabel: false,
      image: false,
      birthyear: false,
      deathyear: false,
      startyear: false,
      endyear: false,
      occupationLabels: false,
      membersLabels: false,
      instrumentsLabels: false,
      genresLabels: false,
      discogs: false,
      allmusic: false,
      wiki: false,
      musicbrainz: false,
      year: false,
      performerLabel: false,
      studioLabel: false,
      producerLabel: false,
      amazon: false
    }
    const {
      name,
      type,
      performer,
      id
    } = options;
    const query = getQuery(options);
    if (showQuery) {
      console.log(query);
    }
    let url = "https://query.wikidata.org/sparql?query="+encodeURI(query)+"&format=json";
    url = await fetch(url, { headers: { "User-Agent": userAgent } });
    url = await url.json();
    if (type === "performer" || typeof performer === "undefined") {
      try {
        url = url.results.bindings[0];
      } catch {
        return defaultResult;
      }
    } else {
      let match;
      try {
        match = url.results.bindings.find(e => e.performerLabel.value.toLowerCase() == performer.toLowerCase());
      } catch {
        return defaultResult;
      }
      if (!match) {
        return defaultResult;
      } else {
        url = match;
      }
    }
    let results = {};
    if (typeof url === "undefined") {
      return results;
    }
    Object.keys(url).forEach(e => {
      results[e] = url[e].value;
    })
    return results;
  }
  async getAllMetadata(options) {
    let wiki = await this.wikiDataSPARQL(options);
    if (wiki.discogs) {
      options.discogsId = wiki.discogs;
    }
    const discogs = await this.discogs(options);
    if ((Object.keys(wiki).length == 0)
    && (discogs.name)
    && (discogs.id)) {
      options.name = discogs.name;
      options.id = {
        discogs: discogs.id
      };
      wiki = await this.wikiDataSPARQL(options);
    }
    return {
      wiki,
      discogs
    };
  }
}
module.exports = MetadataFetcher;

/*
(async () => {
  z = await m.musicbrainz({
    type: "performer",
    name: "Help!",
    id: {
      discogs: 45895,
      musicbrainz: 0,
    },
    musicbrainzId: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d",
    performer: "the beatles"
    }, true);
  console.log(z);
})();
*/
