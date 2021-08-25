import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

new Vue({
  router,
  data() {
    return {
      modalShown: false,
      modalChild: "",
      modalParameter: "",
      notificationText: "",
      notificationShown: false
    }
  },
  methods: {
    cleanFileName(name) {
      name = name.split("/");
      name = name[name.length-1];
      name = name.split(".");
      if (name.length > 1) {
        name = name.slice(0,-1);
      }
      name = name.join(".");
      return name;
    },
    showNotification(text) {
      this.notificationText = text;
      this.notificationShown = true;
      setTimeout(() => {
        this.notificationShown = false;
      }, 3500);
    },
    showModal(child, parameter) {
      this.modalShown = true;
      this.modalChild = child;
      this.modalParameter = parameter;
    },
    hideModal() {
      this.modalShown = false;
    }
  },
  render: h => h(App)
}).$mount('#app')
