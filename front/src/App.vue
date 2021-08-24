<template>
  <main id="app">
    <header>
      <figure>
        <img src="./assets/icon.png">
      </figure>
      <router-link to="/"><h1>Jukeberry</h1></router-link>
    </header>
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

<style src="./assets/style.css"></style>
