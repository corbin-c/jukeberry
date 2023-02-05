<template>
  <ul v-if="status.ready">
    <li>
      <button @click="command('prev')" :disabled="!status.playing">
        <MaterialIcon icon="skip_previous" />
      </button>
    </li>
    <li>
      <button @click="command('rewind')" :disabled="!status.playing">
        <MaterialIcon icon="fast_rewind" />
      </button>
    </li>
    <li>
      <button @click="command('togglePlay')" :disabled="!status.playing">
        <MaterialIcon icon="pause_circle" v-if="status.playing && !status.playing.paused" />
        <MaterialIcon icon="play_circle" v-else />
      </button>
    </li>
    <li>
      <button @click="command('forward')" :disabled="!status.playing">
        <MaterialIcon icon="fast_forward" />
      </button>
    </li>
    <li>
      <button @click="command('next')" :disabled="!status.playing">
        <MaterialIcon icon="skip_next" />
      </button>
    </li>
    <li>
      <button @click="stop()" :disabled="!status.playing">
        <MaterialIcon icon="stop_circle" />
      </button>
    </li>
  </ul>
  <ul v-else></ul>
</template>

<script>
import MaterialIcon from "./MaterialIcon.vue";
import requests from '@/requests.js'

export default {
  name: 'Controls',
  components: {
    MaterialIcon
  },
  props: {
    status
  },
  methods: {
    stop() {
      requests.stop();      
    },
    command(keyword) {
      requests.sendCommand(keyword);
    },
  }
}
</script>
<style scoped>
ul {
  display: flex;
  list-style-type: none;
  justify-content: center;
  align-items: flex-end;
  flex: 0 0 auto;
}

ul > li {
  margin-right: 1rem;
}

ul > li:last-child {
  margin-right: 0;
}

ul > li button {
  width: 3rem;
  height: 3rem;
}

ul > li button .material-icons-outlined {
  font-size: 44px;
  color: var(--neutral);
}
@media screen and (max-width: 768px) {
  ul > li {
    margin: 0;
  }
}
</style>
