<template>
  <div>
    <h1>Информация о пользователе</h1>

    <p v-if="loading">Загрузка...</p>

    <p v-if="error" class="error">{{ error }}</p>

    <p v-if="user">Имя: {{ user.first_name }}, Фамилия: {{ user.last_name }}</p>

    <!-- Поле поиска -->
    <input
      type="text"
      v-model="searchQuery"
      placeholder="Введите имя, фамилию, ID или никнейм"
      class="search-input"
    />

    <div v-if="filteredFriends.length" class="grid">
      <div
        class="tile"
        v-for="friend in filteredFriends"
        :key="friend.id"
        :style="{
          backgroundColor: calculateBackgroundColor(friend.common_count),
        }"
      >
        <img :src="friend.photo_200" alt="Фото друга" class="avatar" />
        <div class="info">
          <p>
            <strong>{{ friend.last_name }} {{ friend.first_name }} </strong>
          </p>
          <p>
            Пол: <span v-if="friend.sex == 2">мужской</span
            ><span v-else>женский</span>
          </p>
          <p>Дата рождения: {{ friend.bdate || "не указана" }}</p>
          <p>Общие друзья: {{ friend.common_count || 0 }}</p>
        </div>
      </div>
    </div>
    <p v-else>Друзья не найдены.</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: true,
      error: null,
      user: null, // Данные пользователя
      friends: [], // Список друзей
      searchQuery: "", // Строка поиска
    };
  },
  mounted() {
    this.getUserInfo();
    this.getFriends();
  },
  computed: {
    filteredFriends() {
      const query = this.searchQuery.toLowerCase();
      return this.sortedFriends.filter(
        (friend) =>
          friend.first_name.toLowerCase().includes(query) ||
          friend.last_name.toLowerCase().includes(query) ||
          friend.domain.toLowerCase().includes(query) ||
          String(friend.id).includes(query)
      );
    },
    sortedFriends() {
      // Сортируем друзей по фамилии
      return [...this.friends].sort((a, b) =>
        a.last_name.localeCompare(b.last_name)
      );
    },
    maxCommonCount() {
      // Находим максимальное количество общих друзей в массиве
      return Math.max(
        ...this.friends.map((friend) => friend.common_count || 0),
        1
      ); // Минимум 1, чтобы избежать деления на 0
    },
  },
  methods: {
    async getUserInfo() {
      const token = getCookie("access_token");
      if (!token) {
        this.error = "Токен не найден. Авторизуйтесь заново.";
        this.loading = false;
        return;
      }

      VK.Api.call("users.get", { access_token: token, v: "5.199" }, (r) => {
        if (r.response != undefined) {
          this.user = r.response[0];
          console.log(r.response[0]);
        } else {
          this.error = "Не удалось получить данные пользователя.";
        }
        this.loading = false;
      });
    },
    async getFriends() {
      const token = getCookie("access_token");
      if (!token) {
        this.error = "Токен не найден.";
        this.loading = false;
        return;
      }

      VK.Api.call(
        "friends.get",
        {
          access_token: token,
          v: "5.199",
          fields:
            "first_name,last_name,sex,bdate,common_count,photo_200,domain",
        },
        (response) => {
          if (response.response && response.response.items) {
            this.friends = response.response.items.filter(
              (friend) => !friend.deactivated
            );
            console.log("Список друзей:", this.friends);
          } else {
            this.error = "Некорректный ответ от VK API.";
            console.error("Ошибка VK API:", response);
          }
        }
      );
    },
    calculateBackgroundColor(commonCount) {
      const maxCount = this.maxCommonCount; // Максимальное количество общих друзей
      const alpha = commonCount / maxCount; // Прозрачность (от 0 до 1)
      return `rgba(178, 205, 225, ${alpha})`; // Цвет с динамической прозрачностью
    },
  },
};
</script>

<style scoped>
.error {
  color: red;
  font-weight: bold;
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
  transition: background-color 0.3s ease;
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

.search-input {
  width: 100%;
  padding: 10px;
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}
</style>
