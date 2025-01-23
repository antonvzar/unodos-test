import { defineStore } from "pinia";

export const useAggregatedFriendsStore = defineStore("aggregatedFriends", {
  state: () => ({
    friends: [], // Массив для хранения списка друзей
  }),
  actions: {
    setFriends(newFriends) {
      const friendMap = {};
      for (const friend of newFriends) {
        if (!friendMap[friend.id]) {
          friendMap[friend.id] = {
            ...friend,
            count: 0, // Количество совпадений друзей
            friendsCount: "Загрузка...", // Поле для количества друзей
          };
        }
        friendMap[friend.id].count += 1;
      }
      this.friends = Object.values(friendMap);
    },
    updateFriendCount(friendId, friendsCount) {
      const friendIndex = this.friends.findIndex((f) => f.id === friendId);
      if (friendIndex !== -1) {
        this.friends[friendIndex].friendsCount =
          friendsCount || "Приватный профиль"; // Обновляем friendsCount
        this.friends = [...this.friends]; // Обновляем массив для реактивности
      }
    },
  },
});
