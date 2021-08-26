<template>
  <section>
    <fieldset>
      <legend>Recherche</legend>
      <input v-model="query" type="search" id="searchInput" />
      <button @click="search()">
        <MaterialIcon icon="search" />
      </button>
    </fieldset>
    <ul v-if="results.length > 0">
      <ListItem
        v-for="item in results"
        :showDir="true"
        :key="item.path"
        :context="context"
        :type="item.type"
        :path="item.name" />
    </ul>
  </section>
</template>

<script>
import ListItem from '@/components/ListItem.vue'
import MaterialIcon from "@/components/MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'Search',
  data() {
    return {
      query: "",
      results: []
    }
  },
  components: {
    MaterialIcon,
    ListItem
  },
  methods: {
    async search() {
      this.results = await requests.search(this.context,this.query);
    }
  },
  props: {
    context: String
  }
}
</script>
