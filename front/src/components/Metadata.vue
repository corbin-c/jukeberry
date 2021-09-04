<template>
  <article>
    <figure>
      <img :src="currentPicture" @click="nextPicture" />
    </figure>
    <dl>
      <dt v-if="md.album">
        <MaterialIcon icon="album" />
      </dt>
      <dd v-if="md.album">
        {{ md.album }}
      </dd>
      <dt v-if="md.artist">
        <MaterialIcon icon="face" />
      </dt>
      <dd v-if="md.artist">
        {{ md.artist }}
      </dd>
      <dt v-if="md.genre">
        <MaterialIcon icon="speaker" />
      </dt>
      <dd v-if="md.genre">
        {{ md.genre.join(", ") }}
      </dd>
      <dt v-if="md.artistDetails && (md.artistDetails.instruments || md.artistDetails.members)">
        <MaterialIcon icon="piano" />
      </dt>
      <dd v-if="md.artistDetails && (md.artistDetails.instruments || md.artistDetails.members)">
        {{ (md.artistDetails.instruments || md.artistDetails.members).join(", ") }}
      </dd>
      <dt v-if="md.artistDetails && md.artistDetails.occupations">
        <MaterialIcon icon="emoji_symbols" /><!-- occupation -->
      </dt>
      <dd v-if="md.artistDetails && md.artistDetails.occupations">
        {{ md.artistDetails.occupations.join(", ") }}
      </dd>
      <dt v-if="md.artistDetails && (md.artistDetails.birthYear || md.artistDetails.deathYear)">
        <MaterialIcon icon="cake" />
      </dt>
      <dd v-if="md.artistDetails && (md.artistDetails.birthYear || md.artistDetails.deathYear)">
        {{ [md.artistDetails.birthYear || "…", md.artistDetails.deathYear || "…"].join(" – ") }}
      </dd>
      <dt v-if="md.artistDetails && (md.artistDetails.startYear || md.artistDetails.endYear)">
        <MaterialIcon icon="cake" />
      </dt>
      <dd v-if="md.artistDetails && (md.artistDetails.startYear || md.artistDetails.endYear)">
        {{ [md.artistDetails.startYear || "…", md.artistDetails.endYear || "…"].join(" – ") }}
      </dd>
      <dt v-if="md.artistDetails && (md.artistDetails.country || md.artistDetails.birthplace)">
        <MaterialIcon icon="map" /><!-- lieu de naissance / pays -->
      </dt>
      <dd v-if="md.artistDetails && (md.artistDetails.country || md.artistDetails.birthplace)">
        {{ [md.artistDetails.birthplace, md.artistDetails.country].join(", ") }}
      </dd>
      <dt v-if="md.composer">
        <MaterialIcon icon="emoji_objects" />
      </dt>
      <dd v-if="md.composer">
        {{ md.composer[0] }}
      </dd>
      <dt v-if="md.artistDetails && md.artistDetails.description">
        <MaterialIcon icon="description" />
      </dt>
      <dd v-if="md.artistDetails && md.artistDetails.description && descriptionShown" @click="toggleDescription">
        {{ md.artistDetails.description }}
      </dd>
      <dd v-if="md.artistDetails && md.artistDetails.description && !descriptionShown" @click="toggleDescription">
        Description
      </dd>
      <dt v-if="md.year">
        <MaterialIcon icon="calendar_today" /><!-- année -->
      </dt>
      <dd v-if="md.year">
        {{ md.year }}
      </dd>
      <dt v-if="md.label">
        <MaterialIcon icon="equalizer" /><!-- label -->
      </dt>
      <dd v-if="md.label">
        {{ md.label[0] }}
      </dd>
      <dt v-if="md.albumDetails && md.albumDetails.studio">
        <MaterialIcon icon="headphones" /><!-- studio -->      
      </dt>
      <dd v-if="md.albumDetails && md.albumDetails.studio">
        {{ md.albumDetails.studio }}
      </dd>
      <dt v-if="md.albumDetails && md.albumDetails.producer">
        <MaterialIcon icon="work" /><!-- producteur -->
      </dt>
      <dd v-if="md.albumDetails && md.albumDetails.producer">
        {{ md.albumDetails.producer }}
      </dd>
      <dt v-if="md.albumDetails && (md.albumDetails.wikiUrl.length || md.artistDetails.wikiUrl.length)">
        <MaterialIcon icon="auto_stories" /><!-- wiki -->
      </dt>
      <dd v-if="md.albumDetails && (md.albumDetails.wikiUrl.length || md.artistDetails.wikiUrl.length)">
        <a
          v-for="(wiki,i) in [...(md.albumDetails.wikiUrl || []),...(md.artistDetails.wikiUrl || [])]"
          :key="i"
          :href="wiki">
          {{ wikiUrlToLabel(wiki) }}
        </a>
      </dd>
<!--    <MaterialIcon icon="mic_external_on" />
    <MaterialIcon icon="speaker" /> -->
    </dl>
  </article>
</template>

<script>
import requests from '@/requests.js'
import MaterialIcon from "./MaterialIcon.vue";

export default {
  name: 'Metadata',
  data: function() {
    return {
      metadata: {},
      md: {},
      pictureIndex: 0,
      allPictures: [],
      gettingMetadata: false,
      descriptionShown: false
    }
  },
  props: {
    status
  },
  watch: {
    status: function(newStatus, oldStatus) {
      if ((newStatus.playing.metadata.album == oldStatus.playing.metadata.album)
      && (newStatus.playing.metadata.artist == oldStatus.playing.metadata.artist)
      && (Object.keys(this.metadata).length > 0)) {
        return;
      }
      this.getMetadata();
    }
  },
  computed: {
    currentPicture() {
      if (this.allPictures.length) {
        return this.allPictures[this.pictureIndex];
      } else {
        return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Topeka-music.svg/768px-Topeka-music.svg.png";
      }
    }
  },
  mounted() {
    this.getMetadata();
  },
  methods: {
    preparePictures() {
      let allPictures = [];
      if (this.md.picture) {
        allPictures.push(this.md.picture);
      }
      if (this.md.albumDetails && this.md.albumDetails.images) {
        allPictures = [...allPictures, ...this.md.albumDetails.images];
      }
      if (this.md.artistDetails && this.md.artistDetails.images) {
        allPictures = [...allPictures, ...this.md.artistDetails.images];
      }
      this.allPictures = [...(new Set(allPictures))];
    },
    nextPicture() {
      this.pictureIndex += 1;
      if (this.pictureIndex == this.allPictures.length) {
        this.pictureIndex = 0;
      }
    },
    toggleDescription() {
      this.descriptionShown = !this.descriptionShown;
    },
    wikiUrlToLabel(url) {
      let lang = url.match(/(\w+?)(?=\.)/)[0];
      let article = decodeURIComponent(
        url
          .split("/")
          .slice(-1)[0]
          .replace(/_/g," ")
      );
      return article+" ["+lang+"]";
    },
    async getMetadata() {
      if (this.gettingMetadata) {
        return;
      }
      this.allPictures = [];
      this.pictureIndex = 0;
      this.md = this.status.playing.metadata;
      this.preparePictures();
      this.gettingMetadata = true;
      this.metadata = await requests.getMetadata();
      this.gettingMetadata = false;
      this.md = this.metadata;
      this.preparePictures();
    }
  },
  components: {
    MaterialIcon
  }
}
</script>
<style scoped>
article {
  flex: 1 0 auto;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}
figure {
  width: 75%;
  height: 50%;
  margin: auto;
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
dl * {
  color: var(--neutral);
  font-size: 1.3rem;
  display: inline;
}
dl {
  display: grid;
  margin-top: 2rem;
  grid-gap: 1rem;
  grid-template-columns: 0fr 1fr;
}
dt {
  grid-column: 1/2;
}
dd {
  grid-column: 2/3;
}
dt .material-icons-outlined {
  font-size: 1.5rem !important;
}
</style>
