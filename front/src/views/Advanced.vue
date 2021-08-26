<template>
  <section>
    <ul>
      <li>
          <MaterialIcon icon="power_settings_new" />
        <a href="#" @click="shuffleAll()">
          Arrêter
        </a>
      </li>
      <li>
          <MaterialIcon icon="cached" />
        <a href="#" @click="shuffleAll()">
          Regénérer
        </a>
      </li>
    </ul>
  </section>
</template>

<script>
import MaterialIcon from "@/components/MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'Advanced',
  methods: {
    halt() {
      if (confirm("Cela va arrêter le dispositif. Êtes-vous sûr ?")) {
        requests.halt();
      }
    },
    regenerate() {
      requests.regenerate();
    }
  },
  components: {
    MaterialIcon
  }
}
</script>
<style scoped>
  a {
    width: 100%;
  }
</style>
