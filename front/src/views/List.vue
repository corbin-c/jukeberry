<template>
  <ul>
    <ListItem
      v-for="item in list"
      :key="item.path"
      :context="type"
      :type="item.type"
      :path="item.name" />
  </ul>
</template>

<script>
import ListItem from '@/components/ListItem.vue'
import requests from '@/requests.js'

export default {
  name: 'Home',
  components: {
    ListItem
  },
  data: function() {
    return {
      list: []
    }
  },
  watch: {
    path: function () {
      this.fetchList();
    }
  },
  mounted() {
    this.fetchList();
  },
  methods: {
    fetchList: async function() {
      const list = await requests.fetchFileList(this.path);
      this.list = list;
    }
  },
  props: {
    type: String,
    path: String
  }
}
</script>
