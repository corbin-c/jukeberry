<template>
  <li :class="type">
    <router-link v-if="type == 'parentdir'" :to="'/'+context+'/'+path.slice(2)"><MaterialIcon icon="arrow_upward" /></router-link>
    <span v-else>
      {{ fileName }}
    </span>
    <span class="path" v-if="type !== 'parentdir' && showDir === true">
      {{ pathName }}
    </span>
    <div class="actions" v-if="type == 'file'">
      <button @click="play()">
        <MaterialIcon icon="play_circle" />
      </button>
      <button @click="playlistAdd()">
        <MaterialIcon icon="playlist_add" />
      </button>
    </div>
    <div class="actions" v-else-if="type == 'directory'">
      <router-link :to="'/'+context+'/'+path.slice(2)"><MaterialIcon icon="folder_open" /></router-link>
      <button @click="play()">
        <MaterialIcon icon="play_circle" />
      </button>
      <button @click="shuffle()">
      <MaterialIcon icon="shuffle" @click="shuffle()" />
      </button>
    </div>
  </li>
</template>

<script>
import MaterialIcon from "./MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'ListItem',
  components: {
    MaterialIcon
  },
  computed: {
    fileName() {
      return this.$root.cleanFileName(this.path);
    },
    pathName() {
      let name = this.path.split("/");
      name = name.slice(1,-1);
      return name.join("/");
    }
  },
  methods: {
    playlistAdd() {
      this.$root.showModal("playlist",this.path);
    },
    play() {
      requests.play(this.context,this.path,this.type);
    },
    shuffle() {
      requests.play(this.context,this.path,this.type,true);
    }
  },
  props: {
    type: String,
    path: String,
    context: String,
    showDir: Boolean
  }
}
</script>
