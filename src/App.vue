<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import UsersList from "./components/UsersList.vue";

export default {
  components: {
    UsersList,
  },
};
</script>

<style scoped></style>
