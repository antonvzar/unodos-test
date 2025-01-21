<template>
  <div>
    <h1>Поиск пользователей</h1>

    <!-- Поле поиска -->
    <input
      type="text"
      v-model="searchQuery"
      placeholder="Введите Имя Фамилия, ID или никнейм"
      class="search-input"
      @input="searchUsers"
    />

    <!-- Результаты поиска -->
    <div v-if="searchResults.length" class="grid">
      <div
        class="tile"
        v-for="user in searchResults"
        :key="user.id"
        @click="toggleSelection(user)"
        :class="{ selected: selectedUsers.some((u) => u.id === user.id) }"
      >
        <img :src="user.photo_50" alt="Фото" class="avatar" />
        <div class="info">
          <p>
            <strong>{{ user.last_name }} {{ user.first_name }}</strong>
          </p>
          <p>ID: {{ user.id }}</p>
        </div>
      </div>
    </div>

    <!-- Список выбранных пользователей -->
    <h2>Выбранные пользователи</h2>
    <div v-if="selectedUsers.length" class="grid">
      <div
        class="tile"
        v-for="user in selectedUsers"
        :key="user.id"
        @click="toggleSelection(user)"
      >
        <img :src="user.photo_50" alt="Фото" class="avatar" />
        <div class="info">
          <p>
            <strong>{{ user.last_name }} {{ user.first_name }}</strong>
          </p>
          <p>ID: {{ user.id }}</p>
        </div>
      </div>
    </div>

    <!-- Кнопка для построения -->
    <button @click="buildFriendList" class="build-button">
      Построить список друзей
    </button>

    <!-- Список друзей с подсчётом повторений -->
    <h2>Список друзей</h2>
    <div v-if="sortedAggregatedFriends.length" class="grid">
      <div
        class="tile"
        v-for="friend in sortedAggregatedFriends"
        :key="friend.id"
        :style="{ backgroundColor: calculateBackgroundColor(friend.count) }"
        @click="navigateToFriend(friend.id)"
      >
        <img :src="friend.photo_200" alt="Фото друга" class="avatar" />
        <div class="info">
          <p>
            <strong>{{ friend.last_name }} {{ friend.first_name }}</strong>
          </p>
          <p>
            Пол: <span v-if="friend.sex == 2">мужской</span
            ><span v-else>женский</span>
          </p>
          <p>Дата рождения: {{ friend.bdate || "не указана" }}</p>
          <p>Совпадений: {{ friend.count }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useSelectedUsersStore } from "@/stores/selectedUsers.js";
import { useAggregatedFriendsStore } from "@/stores/aggregatedFriends.js";
import { useUserFriendsStore } from "@/stores/userFriends.js";

export default {
  setup() {
    const selectedUsersStore = useSelectedUsersStore();
    const aggregatedFriendsStore = useAggregatedFriendsStore();
    const userFriendsStore = useUserFriendsStore();

    return {
      selectedUsersStore,
      aggregatedFriendsStore,
      userFriendsStore,
    };
  },
  data() {
    return {
      searchQuery: "",
      searchResults: [],
    };
  },
  computed: {
    selectedUsers() {
      return this.selectedUsersStore.users;
    },
    sortedAggregatedFriends() {
      return [...this.aggregatedFriendsStore.friends].sort((a, b) =>
        a.last_name.localeCompare(b.last_name)
      );
    },
  },
  methods: {
    navigateToFriend(friendId) {
      this.$router.push(`/friend/${friendId}`);
    },
    async searchUsers() {
      const token = getCookie("access_token");
      if (!this.searchQuery || !token) {
        this.searchResults = [];
        return;
      }

      VK.Api.call(
        "users.search",
        {
          q: this.searchQuery,
          count: 100,
          fields: "photo_50,domain",
          access_token: token,
          v: "5.199",
        },
        (response) => {
          if (response.response && response.response.items) {
            const query = this.searchQuery.toLowerCase();
            this.searchResults = response.response.items.filter((user) => {
              const fullName =
                `${user.first_name} ${user.last_name}`.toLowerCase();
              const reverseName =
                `${user.last_name} ${user.first_name}`.toLowerCase();
              return (
                String(user.id).includes(query) ||
                fullName.includes(query) ||
                reverseName.includes(query) ||
                user.domain.toLowerCase().includes(query)
              );
            });
          } else {
            this.searchResults = [];
          }
        }
      );
    },

    toggleSelection(user) {
      const isSelected = this.selectedUsers.some((u) => u.id === user.id);
      if (isSelected) {
        this.selectedUsersStore.removeUser(user);
      } else {
        this.selectedUsersStore.addUser(user);
      }
    },
    async buildFriendList() {
      const token = getCookie("access_token");
      if (!token || this.selectedUsers.length === 0) {
        alert("Выберите пользователей перед построением.");
        return;
      }

      const allFriends = [];
      for (const user of this.selectedUsers) {
        await new Promise((resolve) => {
          VK.Api.call(
            "friends.get",
            {
              user_id: user.id,
              fields:
                "first_name,last_name,sex,bdate,common_count,photo_200,domain",
              access_token: token,
              v: "5.199",
            },
            (response) => {
              if (response.response && response.response.items) {
                const activeFriends = response.response.items.filter(
                  (friend) => !friend.deactivated
                );

                // Сохраняем друзей для конкретного пользователя в userFriendsStore
                this.userFriendsStore.setFriends(user.id, activeFriends);

                // Добавляем в общий список друзей
                allFriends.push(...activeFriends);
              }
              resolve();
            }
          );
        });
      }

      // Сохраняем объединённый список друзей в aggregatedFriendsStore
      this.aggregatedFriendsStore.setFriends(allFriends);
    },

    calculateBackgroundColor(count) {
      const maxCount = Math.max(
        ...this.aggregatedFriendsStore.friends.map(
          (friend) => friend.count || 1
        ),
        1
      );
      const alpha = count / maxCount;
      return `rgba(178, 205, 225, ${alpha})`;
    },
  },
};
</script>

<style scoped>
.search-input {
  width: 100%;
  padding: 10px;
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  width: 200px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
}

.tile:hover {
  transform: translateY(-10px);
}

.tile.selected {
  background-color: #cce4ff;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 10px;
  object-fit: cover;
}

.info {
  font-size: 14px;
  color: #333;
}

.build-button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.build-button:hover {
  background-color: #0056b3;
}
</style>
