const getWhere = (options) => {
  const { name, id, type } = options;
  const properties = {
    performer: {
      discogs: "P1953",
      musicbrainz: "P434"
    },
    release: {
      discogs: "P1954",
      musicbrainz: "P436"
    }
  }
  const wheres = {
    performer: `WHERE {
    {
      ?item wdt:P31/wdt:P279* wd:Q215380.
      ?item rdfs:label "${name}"@en.
    }
    union {
      ?musicians wdt:P31 wd:Q66715801.
      ?item wdt:P31 wd:Q5.
      ?item wdt:P106 ?musicians.
      ?item rdfs:label "${name}"@en.
    }`,
    release: `WHERE {
    {
      ?albums wdt:P31 wd:Q106043376.
      ?item wdt:P31 ?albums.
      ?item rdfs:label "${name}"@en.
    }`,
    byId: (id, property) => { return `
    union {
      ?item wdt:${property} "${id}".
    }`
    },
  }
  let where = wheres[type];
  if (!id) {
    return where;
  }
  Object.keys(id).map(k => {
    where += wheres.byId(id[k], properties[type][k]);
  });
  return where;
};
const getQuery = (options) => {
  const {
    name,
    type,
    id
  } = options;
  const where = getWhere(options);
  const queries = {
    performer: `select distinct
      ?isLabel
      ?birthplaceLabel
      ?image
      (year(?birthdate) as ?birthyear)
      (year(?deathdate) as ?deathyear)
      (year(?start) as ?startyear)
      (year(?end) as ?endyear)
      (GROUP_CONCAT(DISTINCT ?occupationLabel; SEPARATOR="|") AS ?occupationLabels)
      (GROUP_CONCAT(DISTINCT ?membersLabel; SEPARATOR="|") AS ?membersLabels)
      (GROUP_CONCAT(DISTINCT ?instrumentsLabel; SEPARATOR="|") AS ?instrumentsLabels)
      (GROUP_CONCAT(DISTINCT ?genresLabel; SEPARATOR="|") AS ?genresLabels)
      ?discogs ?allmusic ?wiki ?musicbrainz
    ${where}
    optional {
      ?item wdt:P31 ?is.
    }
    optional {
      ?item wdt:P106 ?occupation.
      ?occupation wdt:P31 wd:Q66715801.
    }
    optional {
      ?item wdt:P527 ?members.
    }
    optional {
      ?item wdt:P1728 ?allmusic.
    }
    optional {
      ?item wdt:P434 ?musicbrainz.
    }
    optional {
      ?item wdt:P1953 ?discogs.
    }
    optional {
      ?item wdt:P2031 ?start.
    }
    optional {
      ?item wdt:P2032 ?end.
    }
    optional {
      ?item wdt:P569 ?birthdate.
    }
    optional {
      ?item wdt:P570 ?deathdate.
    }
    optional {
      ?item wdt:P18 ?image.
    }
    optional {
      ?item wdt:P19 ?birthplace.
    }
    optional {
      ?item wdt:P136 ?genres.
    }
    optional {
      ?item wdt:P1303 ?instruments.
    }
    optional {
      ?article schema:about ?item;
        schema:inLanguage ?lang;
        schema:name ?wiki;
        schema:isPartOf _:b7.
      _:b7 wikibase:wikiGroup "wikipedia".
      FILTER(?lang IN("en"))
      FILTER(!(CONTAINS(?wiki, ":")))
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". 
                            ?occupation  rdfs:label ?occupationLabel.
                            ?is rdfs:label ?isLabel.
                            ?birthplace rdfs:label ?birthplaceLabel.
                            ?members rdfs:label ?membersLabel.
                            ?instruments rdfs:label ?instrumentsLabel.
                            ?genres rdfs:label ?genresLabel.
                           }
  } group by ?isLabel ?birthplaceLabel ?image ?birthdate ?deathdate ?start ?end ?discogs ?allmusic ?wiki ?musicbrainz`,
    release: `select distinct
        (year(?date) as ?year)
        ?performerLabel
        ?studioLabel
        ?producerLabel
        ?discogs ?amazon ?allmusic ?wiki ?musicbrainz
    ${where}
    optional {
      ?item wdt:P577 ?date.
    }
    optional {
      ?item wdt:P483 ?studio.
    }
    optional {
      ?item wdt:P436 ?musicbrainz.
    }
    optional {
      ?item wdt:P1954 ?discogs.
    }
    optional {
      ?item wdt:P5749 ?amazon.
    }
    optional {
      ?item wdt:P1729 ?allmusic.
    }
    optional {
      ?item wdt:P175 ?performer.
    }
    optional {
      ?item wdt:P162 ?producer.
    }
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "[AUTO_LANGUAGE],fr,en,es,pt"
    }
    optional {
      ?article schema:about ?item;
        schema:inLanguage ?lang;
        schema:name ?wiki;
        schema:isPartOf _:b7.
      _:b7 wikibase:wikiGroup "wikipedia".
      FILTER(?lang IN("en"))
      FILTER(!(CONTAINS(?wiki, ":")))
    }
  } group by ?date ?performerLabel ?studioLabel ?producerLabel ?discogs ?amazon ?allmusic ?wiki ?musicbrainz`
      }
  return queries[type];
}
module.exports = getQuery;
