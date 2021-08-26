<template>
  <li :class="type+' '+context" v-if="!(type == 'parentdir' && typeof currentPath === 'undefined')">
    <router-link v-if="type == 'parentdir'" :to="'/'+context+'/'+path.slice(2)"><MaterialIcon icon="arrow_upward" /></router-link>
    <span v-else>
      <MaterialIcon :icon="(type == 'file') ? 'audiotrack' : 'folder_open'" />
      {{ fileName }}
    </span>
    <router-link
      class="path"
      v-if="type === 'file' && showDir === true"
      :to="'/'+context+'/'+pathName"
    >
      {{ pathName }}
    </router-link>
    <div class="actions" v-if="type == 'file'">
      <button @click="play()">
        <MaterialIcon icon="play_circle" />
      </button>
      <button @click="playlistAdd()">
        <MaterialIcon icon="playlist_add" />
      </button>
    </div>
    <div class="actions" v-else-if="type == 'directory'">
      <router-link :to="'/'+context+'/'+path.slice(2)"><MaterialIcon icon="subdirectory_arrow_right" /></router-link>
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
      return name.join("/").replace(/_/g," ");
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
    currentPath: String,
    path: String,
    context: String,
    showDir: Boolean
  }
}
</script>
<style scoped>
li {
  flex-wrap: wrap;
}
li .path {
  flex: 1 0 auto;
  order: 1;
  width: 100%;
  font-size: .8rem;
  opacity: .7;
}
li span > .material-icons-outlined {
  position: relative;
  top: .4rem;
}
li.parentdir {
  display: flex;
  justify-content: center;
}
</style>
