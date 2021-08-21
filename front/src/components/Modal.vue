<template>
  <div id="modal" v-if="shown">
    <div id="modal_overlay" @click="closeModal()"></div>
    <div id="modal_content">
      <button @click="closeModal()">
        <MaterialIcon icon="cancel" />
      </button>
      <Playlist :modal="true" :path="parameter"/>
    </div>
  </div>
  <div id="hiddenmodal" v-else></div>
</template>

<script>
import MaterialIcon from "./MaterialIcon.vue";
import Playlist from "@/views/Playlist.vue";
export default {
  name: 'Modal',
  props: {
    child: String,
    shown: Boolean,
    parameter: String
  },
  methods: {
    closeModal() {
      this.$root.hideModal();
    }
  },
  components: {
    Playlist,
    MaterialIcon
  }
}
</script>

<style scoped>
#hiddenmodal {
  display: none;
}
#modal {
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 9;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
#modal_overlay {
  width: 100%;
  height: 100%;
  background: black;
  opacity: .75;
  position: absolute;
}
#modal_content {
  position: absolute;
  top: 10%;
  left: 5%;
  width: 90%;
  height: 80%;
  background: white;
  border-radius: 5px;
}
@media screen and (min-width: 1024px) {
  #modal_content {
    top: 25%;
    left: 25%;
    width: 50%;
    height: 50%;
    background: white;
    border-radius: 5px;
  } 
}
button {
  position: absolute;
  right: 0;
}
</style>
