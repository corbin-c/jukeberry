<template>
  <footer>
    <h2 v-if="(status.playing && status.playing.metadata)">
      <MaterialIcon :icon="icon" />
      {{ status.playing.metadata.title || $root.cleanFileName(status.playing.metadata.filename) }}</h2>
    <Controls :status="status"/>
  </footer>
</template>

<script>
import MaterialIcon from "./MaterialIcon.vue";
import Controls from "./Controls.vue";
export default {
  name: 'Footer',
  props: {
    status
  },
  computed: {
    icon() {
      if (!this.status.playing) {
        return;
      }
      if (this.status.playing.paused) {
        return "pause";
      }
      switch (this.status.playing.mode) {
        case "radio":
          return "radio";
        case "music":
          return "music_note";
        case "youtube":
          return "ondemand_video";
        case "video":
          return "movie";
        default:
          return "headphones"
      }
    }
  },
  components: {
    Controls,
    MaterialIcon
  }
}
</script>
<style scoped>
footer {
  width: 100%;
  position: fixed;
  bottom: 0;
  min-height: 100px;
  background: var(--alternate);
  padding: 1rem;
  transition: 1s min-height ease-in-out;
  display: flex;
  flex-direction: column;
}
footer * {
  color: var(--neutral);  
}
h2 {
  font-size: 1.5rem;
  text-align: center;
  padding-bottom: 1.5rem;
  position: relative;
  left: -.3rem;
}
h2 .material-icons-outlined {
  font-size: 2.5rem;
  position: relative;
  top: .6rem;
}
@media screen and (max-width: 768px) {
  h2 {
    font-size: 1.25rem;
  }
  h2 .material-icons-outlined {
    font-size: 1.75rem;
  }
}
</style>
