<template>
  <footer>
    <Controls :status="status"/>
  </footer>
</template>

<script>
import Controls from "./Controls.vue";
export default {
  name: 'Footer',
  props: {
    status
  },
  components: {
    Controls
  }
}
</script>
