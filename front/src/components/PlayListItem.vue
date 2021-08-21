<template>
  <li>
    <button @click="play()" v-if="!isPlaylist">
      <MaterialIcon icon="reorder" />
    </button>
    <span @click="addToPlaylist()">
      {{ fileName }}
    </span>
    <div class="actions" v-if="isPlaylist && !modal">
      <button @click="play()">
        <MaterialIcon icon="playlist_play" />
      </button>
      <button @click="shuffle()">
        <MaterialIcon icon="shuffle" @click="shuffle()" />
      </button>
      <button @click="remove()">
        <MaterialIcon icon="delete" />
      </button>
      <router-link :to="'/playlist/'+id"><MaterialIcon icon="view_list" /></router-link>
    </div>
    <div class="actions" v-else-if="!isPlaylist && !modal">
      <button @click="play()">
        <MaterialIcon icon="playlist_play" />
      </button>
      <button @click="remove()">
        <MaterialIcon icon="delete" />
      </button>
    </div>
  </li>
</template>

<script>
import MaterialIcon from "./MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'PlayListItem',
  components: {
    MaterialIcon
  },
  computed: {
    isPlaylist() {
      return !isNaN(this.id);
    },
    fileName() {
      if (this.isPlaylist) {
        return this.name;
      }
      return this.$root.cleanFileName(this.name);
    }
  },
  methods: {
    async addToPlaylist() {
      if (this.modal) {
        let response = await requests.addToPlaylist(this.id,this.path);
        this.$root.hideModal();
        if (response.error) {
          this.$root.showNotification(response.error);
        } else {
          this.$root.showNotification("'"+ this.$root.cleanFileName(this.path)+"' a été ajouté à la playlist '"+this.name+"'");
        }
      }
    },
    async remove() {
      if (!confirm("Êtes-vous sûr ce vouloir supprimer cet élément ?")) {
        return;
      }
      if (this.isPlaylist) {
        this.$parent.list = await requests.removePlaylist(this.id);
        this.$root.showNotification("La playlist '"+this.name+"' a été supprimée.");
      } else {
        this.$parent.list = await requests.removeTrack(this.playlistId,this.name);
        this.$root.showNotification("La piste '"+this.$root.cleanFileName(this.name)+"' a été supprimée de la playlist.");
      }
    },
    play() {
      requests.play(this.context,this.path,this.type);
    },
    shuffle() {
      requests.play(this.context,this.path,this.type,true);
    }
  },
  props: {
    id: Number,
    playlistId: Number,
    name: String,
    path: String,
    modal: Boolean
  }
}
</script>
