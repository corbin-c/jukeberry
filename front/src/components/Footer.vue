<template>
  <footer
    v-on:touchstart="touchStart"
    v-on:touchmove="touchMove"
    :class="(status.playing && status.playing.metadata && isDrawerOpen) ? 'open':''">
    <transition name="fade">
      <Metadata v-if="(status.playing && status.playing.metadata && isDrawerOpen)" :status="status"/>
    </transition>
    <h2 v-if="(status.playing && status.playing.metadata)">
      <MaterialIcon :icon="icon" />
      {{ status.playing.metadata.title || $root.cleanFileName(status.playing.metadata.filename) }}</h2>
    <Controls :status="status"/>
    <button v-on:click="toggleDrawer">
    <MaterialIcon
      icon="expand_less"
      id="expand"
      :class="isDrawerOpen ? 'open':'' " />
    </button>
  </footer>
</template>

<script>
import MaterialIcon from "./MaterialIcon.vue";
import Controls from "./Controls.vue";
import Metadata from "./Metadata.vue";
export default {
  name: 'Footer',
  data: function() {
    return {
      isDrawerOpen: false,
      firstTouch: {
        x: null,
        y: null
      }
    }
  },
  props: {
    status
  },
  methods: {
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
    },
    openDrawer() {
      if (this.status.playing && this.status.playing.metadata) {
        this.isDrawerOpen = true;
      }
    },
    closeDrawer() {
      this.isDrawerOpen = false;      
    },
    getCoords(e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX,
        y: touch.clientY
      }
    },
    touchStart(e) {
      const touch = this.getCoords(e);
      this.firstTouch.x = touch.x;
      this.firstTouch.y = touch.y;
    },
    touchMove(e) {
      if (!this.firstTouch.x || !this.firstTouch.y) {
        return;
      }
      const touch = this.getCoords(e);
      const diff = {
        x: this.firstTouch.x - touch.x,
        y: this.firstTouch.y - touch.y
      }
      if (Math.abs(diff.x) < Math.abs(diff.y)) {
        //y swipe
        if (diff.y > 0) {
          //up
          this.openDrawer();
        } else {
          //down
          this.closeDrawer();
        }
      }
      this.firstTouch.x = null;
      this.firstTouch.y = null;
    }
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
        case "podcast":
          return "podcasts";
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
    MaterialIcon,
    Metadata
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
  justify-content: flex-end;
  max-height: calc(100vh - 120px);
}
footer.open {
  min-height: calc(100vh - 120px);
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
#expand {
  position: absolute;
  bottom: 0;
  right: 0;
  transition: transform 1s;
}
#expand.open {
  transform: scaleY(-1);
}
@media screen and (max-width: 768px) {
  #expand {
    display: none;
  }
  h2 {
    font-size: 1.25rem;
  }
  h2 .material-icons-outlined {
    font-size: 1.75rem;
  }
}
.fade-enter-active {
  transition: max-height 1s;
}
.fade-leave-active {
  transition: max-height 1s;
}
.fade-enter, .fade-leave-to {
  max-height: 0;
}
</style>
