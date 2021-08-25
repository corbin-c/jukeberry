<template>
  <section :class="modal ? 'modal':''">
    <div v-if="modal">
      <label for="create">Créez une nouvelle playlist…</label>
      <input type="text" name="create" id="create" v-model="name" />
      <button @click="createPlaylist()">
        <MaterialIcon icon="queue_music" />
      </button>
      <p v-if="list.length > 0">…ou sélectionnez-en une ci-dessous :</p>
    </div>
    <ul :class="modal ? 'modal':''">
      <li class="parent" v-if="!modal && id">
        <router-link to="/playlist/"><MaterialIcon icon="arrow_back" /></router-link>
      </li>
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

<style scoped>
section.modal {
  display: flex;
  flex-direction: column;
  height: 100%;
}
div, label, input, p {
  margin-bottom: 1rem;
}
input {
  width: calc(100% - 3rem);
}
label {
  margin-right: 1rem;
}
button {
  margin-left: .6rem;
  position: relative;
  top: .7rem;
}
button .material-icons-outlined {
  font-size: 2rem;
}
ul.modal {
  overflow-y: scroll;
}
ul.modal li {
  cursor: pointer;
  min-height: 2rem;
  padding: .5rem;
  display: flex;
  justify-content: ;
  align-items: center;
  background: var(--neutral2);
}
ul.modal li:nth-child(2n+1) {
  background: var(--neutral);
}
.parent {
  display: flex;
  justify-content: center;
}
</style>
