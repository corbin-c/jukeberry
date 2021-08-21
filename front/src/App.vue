<template>
  <main id="app">
    <router-view/>
    <Footer :status="status"/>
    <Modal
      :shown="$root.modalShown"
      :child="$root.modalChild"
      :parameter="$root.modalParameter" />
    <div
      id="notification"
      v-if="$root.notificationShown"
      v-html="$root.notificationText">
    </div>
  </main>
</template>

<script>
import Modal from "./components/Modal.vue";
import Footer from "./components/Footer.vue";
export default {
  name: 'Jukeberry',
  data() {
    return {
      status: {}
    }
  },
  mounted() {
    //~ const ws = new WebSocket("ws://"+document.location.host);
    const ws = new WebSocket("ws://localhost:5000");
    ws.onmessage = (event) => {
      this.status = JSON.parse(event.data);
      console.log(JSON.parse(event.data));
    }
  },
  components: {
    Footer,
    Modal
  }
}
</script>

<style>
#notification {
  opacity: .75;
  background: black;
  border-radius: 5px;
  position: fixed;
  bottom: 5%;
  right: 5%;
  width: 90%;
  padding: 15px;
  color: white;
}
@media screen and (min-width: 1024px) {
  #notification {
    width: 20%;
  }
}
</style>
