<template>
  <section>
    <ul>
      <li>
          <MaterialIcon icon="music_note" />
        <router-link to="/music">
          Musique
        </router-link>
      </li>
      <li>
          <MaterialIcon icon="shuffle" />
        <a href="#" @click="shuffleAll()">
          Aléatoire
        </a>
      </li>
      <li>
          <MaterialIcon icon="radio" />
        <router-link to="/radio">
          Radio
        </router-link>
      </li>
      <li>
          <MaterialIcon icon="playlist_play" />
        <router-link to="/playlist">
          Playlist
        </router-link>
      </li>
      <li>
          <MaterialIcon icon="search" />
        <router-link to="/search/music">
          Recherche
        </router-link>
      </li>
      <li>
          <MaterialIcon icon="settings" />
        <router-link to="/advanced">
          Avancé
        </router-link>
      </li>
    </ul>
  </section>
</template>

<script>
import MaterialIcon from "@/components/MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'Home',
  methods: {
    shuffleAll() {
      requests.shuffleAll();
    }
  },
  components: {
    MaterialIcon
  }
}
</script>
<style scoped>
  a {
    width: 100%;
  }
</style>
