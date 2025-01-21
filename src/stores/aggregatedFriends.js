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
          friendMap[friend.id] = { ...friend, count: 0 };
        }
        friendMap[friend.id].count += 1;
      }
      this.friends = Object.values(friendMap);
    },
  },
});
