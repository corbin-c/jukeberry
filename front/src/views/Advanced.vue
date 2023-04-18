<template>
  <section>
    <ul>
      <li>
        <MaterialIcon icon="power_settings_new" />
        <a href="#" @click="halt()">
          Arrêter
        </a>
      </li>
      <li>
        <MaterialIcon icon="cached" />
        <a href="#" @click="regenerate()">
          Regénérer
        </a>
      </li>
      <li><MaterialIcon icon="volume_up" /> Sortie son</li>
      <li>
        <label>
          <input
            type="radio"
            name="soundOuput"
            value="default"
            @click="setSoundOutput('default')"
            :checked="soundOuput === 'default'"
          />
          Line out
        </label>
      </li>
      <li>
        <label>
          <input
            type="radio"
            name="soundOuput"
            value="fm"
            @click="setSoundOutput('fm')"
            :checked="soundOuput === 'fm'"
          />
          FM
        </label>
      </li>
      <li>
        <label>
          <input
            type="radio"
            name="soundOuput"
            value="bluetooth"
            @click="setSoundOutput('bluetooth')"
            :checked="soundOuput === 'bluetooth'"
          />
          Bluetooth
        </label>
      </li>
    </ul>
  </section>
</template>

<script>
import MaterialIcon from "@/components/MaterialIcon.vue";
import requests from "@/requests.js";

export default {
  name: "Advanced",
  data: function() {
    return {
      soundOuput: "default",
    };
  },
  watch: {
    path: function() {
      this.getSoundOutput();
    },
  },
  mounted() {
    this.getSoundOutput();
  },
  methods: {
    setSoundOutput: async function(value) {
      this.soundOuput = value;
      const results = await requests.setSoundOutput(value);
      this.soundOuput = results;
    },
    getSoundOutput: async function() {
      const results = await requests.getSoundOutput();
      this.soundOuput = results;
    },
    halt() {
      if (confirm("Cela va arrêter le dispositif. Êtes-vous sûr ?")) {
        requests.halt();
      }
    },
    regenerate() {
      requests.regenerate();
    },
  },
  components: {
    MaterialIcon,
  },
};
</script>
<style scoped>
label {
  padding-left: 2rem;
  width: 100%;
  display: flex;
}
input {
  width: 1.8rem;
  height: 1.8rem;
  margin-right: 0.3rem;
}
a {
  width: 100%;
}
</style>
