import { defineStore } from "pinia";

export const useSelectedUsersStore = defineStore("selectedUsers", {
  state: () => ({
    users: [], // Список выбранных пользователей
  }),
  actions: {
    addUser(user) {
      if (!this.users.some((u) => u.id === user.id)) {
        this.users.push(user);
      }
    },
    removeUser(user) {
      this.users = this.users.filter((u) => u.id !== user.id);
    },
    clearUsers() {
      this.users = [];
    },
  },
});
