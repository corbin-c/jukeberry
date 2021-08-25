<template>
  <div>
    <span>{{ title }}</span>
    <label>
      <input type="checkbox" v-on:input="check" :checked="checked">
      <span>{{ label }}</span>
    </label>
  </div>
</template>

<script>
export default {
  name: 'Toggler',
  computed: {
    label() {
      return this.checked ? this.on : this.off;
    }
  },
  methods: {
    check(e) {
      this.$emit("input", e.target.checked);
    }
  },
  props: {
    checked: Boolean,
    on: String,
    off: String,
    title: String
  }
}
</script>
<style scoped>
label {
  position: relative;
  padding-left: 3rem;
  display: block;
}
div > span {
  display: block;
  margin-bottom: 1rem;
}
input {
  width: 0;
  height: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
  position: absolute;
}
label span:after, label span:before {
  content:"";
  display: block;
  position: absolute;
  top: -.1rem;
  left: 0;
  transition: all .4s;
}
label span:after {
  background: var(--neutral2);
  margin-top: .12rem;
  margin-left: .15rem;
  height: 1.2rem;
  width: 1.2rem;
  border-radius: 100%;
  box-shadow: 0rem .1rem .1rem rgba(0,0,0,0.5);
}
label span:before {
  box-shadow: inset 0rem 0rem .2rem rgba(0,0,0,0.5);
  background: var(--neutral);
  height: 1.5rem;
  width: 2.5rem;
  border-radius: 27.5%/50%;
}
input:checked + span:before {
  background: var(--contrast2);
}
input:checked + span:after {
  margin-left: 1.15rem;
}
</style>
