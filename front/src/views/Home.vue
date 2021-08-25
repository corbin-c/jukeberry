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
    </ul>
  </section>
</template>

<script>
import MaterialIcon from "@/components/MaterialIcon.vue";

export default {
  name: 'Home',
  components: {
    MaterialIcon
  }
}
</script>
<style scoped>
  
</style>
