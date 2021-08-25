<template>
  <section>
    <fieldset>
      <legend>Ajouter une nouvelle radio</legend>
      <input v-model="nrName" type="text" placeholder="Nom de la radio"/>
      <input v-model="nrUrl" type="text" placeholder="Url du flux"/>
      <button @click="addRadio()">
        <MaterialIcon icon="add_circle_outline" />
      </button>
    </fieldset>
    <Toggler
      v-model="favOnly"
      title="Affichage des radios"
      off="Toutes les radios"
      on="Radios favorites"
      :checked="favOnly" />
    <ul>
      <li
        class="radio"
        v-for="(item, index) in list"
        :key="index">
        <MaterialIcon icon="radio" />
        {{ item.name }}
        <div class="actions">
          <button @click="playRadio(item.url)">
            <MaterialIcon icon="play_circle" />
          </button>
          <button @click="toggleFav(item.url, item.name, item.favorite)">
            <MaterialIcon :icon="item.favorite ? 'star' : 'star_outline'" />
          </button>
          <button @click="remove(item.url, item.name)">
            <MaterialIcon icon="delete" />
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script>
import Toggler from '@/components/Toggler.vue'
import MaterialIcon from "@/components/MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'Radio',
  data() {
    return {
      nrName: "",
      nrUrl: "",
      favOnly: true,
      completeList: []
    }
  },
  components: {
    Toggler,
    MaterialIcon
  },
  computed: {
    list() {
      if (!this.favOnly) {
        return this.completeList;
      }
      return this.completeList.filter(e => e.favorite);
    }
  },
  methods: {
    async getRadios() {
      const list = await requests.allRadios();
      this.completeList = list.sort((a,b) => a.name.localeCompare(b.name));
    },
    async addRadio() {
      if (this.nrName == "" || this.nrUrl == "" ){
        return;
      }
      const list = await requests.addRadio(this.nrName,this.nrUrl);
      this.completeList = list.sort((a,b) => a.name.localeCompare(b.name));
      this.$root.showNotification("La radio '"+this.nrName+"' a été ajoutée");
      this.nrName = "";
      this.nrUrl = ""; 
    },
    playRadio(radioUrl) {
      requests.playRadio(radioUrl);
    },
    async toggleFav(radioUrl,radioName,wasFavorite) {
      const list = await requests.toggleFavoriteRadio(radioUrl);
      this.completeList = list.sort((a,b) => a.name.localeCompare(b.name));
      this.$root.showNotification("La radio '"+radioName+"' a été "+(wasFavorite ? "retirée des":"ajoutée aux")+" favoris");
    },
    async remove(radioUrl,radioName) {
      const list = await requests.removeRadio(radioUrl);
      this.completeList = list.sort((a,b) => a.name.localeCompare(b.name));      
      this.$root.showNotification("La radio '"+radioName+"' a été supprimée");
    }
  },
  mounted() {
    this.getRadios();
  },
  props: {
  }
}
</script>
<style scoped>
ul button:first-of-type {
  margin-left: auto;
}
fieldset {
  margin: 1.5rem;
  padding: 1.5rem;
  border: 2px solid var(--contrast2);
  display: flex;
  justify-content: space-evenly;
}
legend {
  padding-left: .5rem;
  padding-right: .5rem;
}
fieldset button .material-icons-outlined {
  font-size: 2rem;
}
@media screen and (max-width: 1024px) {
  fieldset {
    border: 0;
    margin: 0rem;
    padding: 0rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
    flex-direction: column;
  }
  legend {
    padding: 0;
    text-align: center;
    width: 100%;
    margin-top: 1rem;
  }
  input {
    margin-bottom: 1rem;
  }
}
section > div {
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
  align-items: center;
}
</style>
