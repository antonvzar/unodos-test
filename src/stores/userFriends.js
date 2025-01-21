import { defineStore } from "pinia";

export const useUserFriendsStore = defineStore("userFriends", {
  state: () => ({
    friends: {}, // Объект для хранения списка друзей по user_id
  }),
  actions: {
    setFriends(userId, friendsList) {
      this.friends[userId] = friendsList; // Сохраняем друзей для конкретного пользователя
    },
    getFriends(userId) {
      return this.friends[userId] || []; // Возвращаем друзей для конкретного пользователя
    },
  },
});