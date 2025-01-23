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
        const updatedFriend = {
          ...this.friends[friendIndex],
          friendsCount: friendsCount || "Приватный профиль",
        };
        this.friends.splice(friendIndex, 1, updatedFriend); // Реактивное обновление массива
      } else {
        console.warn(
          `Друг с ID ${friendId} не найден в aggregatedFriendsStore. Добавляем его.`
        );
        this.friends.push({
          id: friendId,
          friendsCount: friendsCount || "Приватный профиль",
          count: 1, // Устанавливаем значение count, если нужно
        });
      }
    },
  },
});
