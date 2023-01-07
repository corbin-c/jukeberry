<template>
  <section v-if="!(typeof podcast !== 'undefined' && podcast.length)">
    <fieldset>
      <legend>Ajouter un nouveau podcast</legend>
      <input v-model="nrUrl" type="text" placeholder="Url du flux RSS"/>
      <button @click="addPodcast()">
        <MaterialIcon icon="add_circle_outline" />
      </button>
    </fieldset>
    <ul>
      <li
        class="radio"
        v-for="(item, index) in list"
        :key="index">
        <MaterialIcon icon="podcasts" />
        {{ item.name }}
        <div class="actions">
          <router-link :to="'/podcasts/'+btoa(item.url)">
            <MaterialIcon icon="toc" />
          </router-link>
          <button @click="remove(item.url)">
            <MaterialIcon icon="delete" />
          </button>
        </div>
      </li>
    </ul>
  </section>
  <section v-else>
    <h1>{{ details.name }}</h1>
    <div>{{ description }}</div>
    <ul>
      <li v-for="(item) in details.episodes" :key="item.url">
        {{ item.name }}
        <div class="actions">
          <button @click="playPodcast(details.url, item.url)">
            <MaterialIcon icon="play_circle" />
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script>
import MaterialIcon from "@/components/MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'Podcasts',
  data() {
    return {
      nrUrl: "",
      favOnly: true,
      list: [],
      details: {
        name: "",
        url: "",
        description: "",
        episodes: ""
      }
    }
  },
  components: {
    MaterialIcon
  },
  methods: {
    async getPodcasts() {
      const list = await requests.allPodcasts();
      this.completeList = list.sort((a,b) => a.name.localeCompare(b.name));
    },
    async addPodcast() {
      if (this.nrUrl == "" ){
        return;
      }
      const list = await requests.addPodcast(this.nrUrl);
      this.list = list.sort((a,b) => a.name.localeCompare(b.name));
      this.$root.showNotification("Le podcast a été ajouté");
      this.nrUrl = ""; 
    },
    async updatePodcast(url) {
      this.details = await requests.updatePodcast(url);
    },
    playPodcast(podcastFeedUrl, episodeUrl) {
      requests.playPodcast(podcastFeedUrl, episodeUrl);
    },
    async remove(podcastUrl) {
      const list = await requests.removePodcast(podcastUrl);
      this.completeList = list.sort((a,b) => a.name.localeCompare(b.name));      
      this.$root.showNotification("Le podcast a été supprimé");
    }
  },
  mounted() {
    this.podcast && this.podcast.length
    ? this.getPodcasts()
    : this.updatePodcast(this.podcast);
  },
  props: {
    podcast: String
  }
}
</script>
<style scoped>
fieldset {
  grid-template-columns: 1fr 1fr 0fr;
}
fieldset input:last-of-type {
  grid-column: 1/3;
}
@media screen and (max-width: 1024px) {
  fieldset {
    grid-template-columns: 1fr 0fr;
    grid-template-rows: 1fr;
  }
  fieldset input:first-of-type {
    grid-column: 1/2;
    grid-row: 1/2;
  }
}
ul button:first-of-type {
  margin-left: auto;
}
section > div {
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
  align-items: center;
}
</style>
