<template>
  <section>
    <router-link v-if="!modal && id" to="/playlist/"><MaterialIcon icon="arrow_back" /></router-link>
    <div v-if="modal">
      <label for="create">Créez une nouvelle playlist…</label>
      <input type="text" name="create" id="create" v-model="name" />
      <button @click="createPlaylist()">
        <MaterialIcon icon="queue_music" />
      </button>
      <p v-if="list.length > 0">…ou sélectionnez-en une ci-dessous :</p>
    </div>
    <ul>
      <PlayListItem
        v-for="(item,index) in list"
        :key="index"
        :index="index"
        :id="parseInt(item.id)"
        :modal="modal"
        :path="path"
        :playlistId="parseInt(id)"
        :name="item.name || item" />
    </ul>
  </section>
</template>

<script>
import MaterialIcon from "@/components/MaterialIcon.vue";
import PlayListItem from '@/components/PlayListItem.vue'
import requests from '@/requests.js'

export default {
  name: 'Playlist',
  components: {
    PlayListItem,
    MaterialIcon
  },
  data: function() {
    return {
      name: "",
      list: []
    }
  },
  watch: {
    id: function () {
      this.getList();
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    async organize(elementAfter,element) {
      const newIndex = this.list.indexOf(elementAfter);
      this.list = await requests.organizePlaylist(parseInt(this.id),element,newIndex);
    },
    getList() {
      if (this.id) {
        this.getPlaylist(parseInt(this.id));
      } else {
        this.allPlaylists();
      }
    },
    getPlaylist: async function(id) {
      const list = await requests.getPlaylist(id);
      this.list = list;
    },
    allPlaylists: async function() {
      const list = await requests.allPlaylists();
      this.list = list;
    },
    createPlaylist: async function() {
      const list = await requests.createPlaylist(this.name,this.path);
      this.list = list;
      if (this.modal) {
        this.$root.hideModal();
      }
      this.$root.showNotification("La playlist '"+this.name+"' a été créée.<br>'"+this.$root.cleanFileName(this.path)+"' y a été ajouté.");
    }
  },
  props: {
    id: String,
    path: String,
    modal: Boolean
  }
}
</script>
