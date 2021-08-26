<template>
  <main id="app">
    <header>
      <figure v-on:click="showNav()">
        <img src="./assets/icon.png">
      </figure>
      <nav :class="(navShown) ? 'shown':'hidden'" v-on:click="showNav()">
        <ul>
          <li>
            <router-link to="/">Jukeberry</router-link>
          </li>
          <li>
            <router-link to="/music">Musique</router-link>
          </li>
          <li>
            <router-link to="/radio">Radio</router-link>
          </li>
          <li>
            <router-link to="/playlist">Playlist</router-link>
          </li>
          <li>
            <router-link to="/search/music">Recherche</router-link>
          </li>
        </ul>
      </nav>
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
      status: {},
      navShown: false
    }
  },
  methods: {
    showNav() {
      this.navShown = !this.navShown;
    }
  },
  mounted() {
    //~ const ws = new WebSocket("ws://"+document.location.host);
    const ws = new WebSocket("ws://jukeberry:5000");
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
