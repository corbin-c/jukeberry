import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/music/:path*',
    name: 'Music List',
    component: () => import(/* webpackChunkName: "list" */ '../views/List.vue'),
    props: (route) => {
      return {
        type: "music",
        path: route.params.path
      }
    }
  },
  {
    path: '/advanced/',
    name: 'Advanced',
    component: () => import(/* webpackChunkName: "list" */ '../views/Advanced.vue'),
  },
  {
    path: '/radio/',
    name: 'Radio',
    component: () => import(/* webpackChunkName: "list" */ '../views/Radio.vue'),
  },
  {
    path: '/search/:context',
    name: 'Search Form',
    component: () => import(/* webpackChunkName: "list" */ '../views/Search.vue'),
    props: true
  },
  {
    path: '/playlist/:id?',
    name: 'Playlist',
    component: () => import(/* webpackChunkName: "list" */ '../views/Playlist.vue'),
    props: (route) => {
      return {
        modal: false,
        id: route.params.id
      }
    }
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
