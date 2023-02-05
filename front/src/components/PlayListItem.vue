<template>
  <li
    :draggable="!isPlaylist"
    v-on:dragstart="move"
    v-on:dragenter="dragEnter"
    v-on:dragleave="dragLeave"
    v-on:dragend="hasMoved"
    v-on:dragover="dragover"
    v-on:drop="drop"
    :class="classList.join(' ')">
    <MaterialIcon class="order" icon="reorder" v-if="!isPlaylist" />
    <span @click="addToPlaylist()">
      {{ fileName }}
    </span>
    <div class="actions" v-if="isPlaylist && !modal">
      <button @click="playList()">
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
      <button @click="playSong()">
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
  data() {
    return {
      classList: [],
      isMoving: false
    }
  },
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
    playlistAdd() {
      this.$root.showModal("playlist","CURRENT_MEDIA");
    },
    dragover(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'move';
      if (!this.classList.includes("over") && !this.isMoving) {
        this.classList.push('over');
      }
    },
    drop(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      this.classList = [];
      this.$parent.organize(this.name,e.dataTransfer.getData('text/plain'));
    },
    dragEnter() {
      if (!this.isMoving) {
        this.classList.push('over');
      }
    },
    dragLeave() {
      this.classList = this.classList.filter(e => e != "over");
    },
    move(e) {
      console.log("moving");
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.name);
      this.classList.push("moving");
      this.isMoving = true;
    },
    hasMoved() {
      this.classList = this.classList.filter(e => e != "moving");
      this.isMoving = false;
    },
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
    playList() {
      requests.play("playlist",parseInt(this.id));      
    },
    playSong() {
      requests.play("playlist",parseInt(this.playlistId),parseInt(this.index));
    },
    shuffle() {
      requests.play("playlist",parseInt(this.id),0,true);
    }
  },
  props: {
    index: Number,
    id: Number,
    playlistId: Number,
    name: String,
    path: String,
    modal: Boolean
  }
}
</script>
<style scoped>
.order {
  top: 0;
}
li.moving {
  opacity: .5;
}
li.over {
  padding-top: 100px;
}
</style>
