<template>
  <div>
    <h1>Информация о друге</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else>
      <div class="friend-info">
        <img :src="friend.photo_200" alt="Фото друга" class="avatar" />
        <p>
          <strong>{{ friend.last_name }} {{ friend.first_name }}</strong>
        </p>
      </div>

      <!-- Кнопка "Назад" -->
      <button class="back-button" @click="goBack">Назад</button>

      <h2>Выбранные пользователи, у которых этот друг в друзьях</h2>
      <ul>
        <li v-for="user in sharedUsers" :key="user.id">
          {{ user.first_name }} {{ user.last_name }}
        </li>
      </ul>

      <h2>Записи на стене</h2>
      <div v-if="posts.length === 0" class="no-posts">Нет записей.</div>
      <div class="posts-container">
        <div v-for="post in posts" :key="post.id" class="post">
          <div class="post-content">
            <p class="post-text">{{ post.text || "Текст отсутствует" }}</p>
            <p v-if="post.copy_history" class="repost-info">
              <em>Репост из:</em>
              {{ getRepostSource(post.copy_history[0].from_id) }}
            </p>
          </div>
          <div class="attachments">
            <div class="photos-container">
              <img
                v-for="photo in extractPhotos(post)"
                :key="photo.id"
                :src="photo.src"
                alt="Фото"
                class="attachment-photo"
              />
            </div>
            <div class="videos-container">
              <div
                v-for="video in extractVideos(post)"
                :key="video.id"
                class="attachment-video"
              >
                <a :href="video.link" target="_blank">Смотреть видео</a>
              </div>
            </div>

            <div v-if="post.copy_history">
              <div class="photos-container">
                <img
                  v-for="photo in extractPhotosFromReposts(post)"
                  :key="photo.id"
                  :src="photo.src"
                  alt="Фото из репоста"
                  class="attachment-photo"
                />
              </div>
              <div class="videos-container">
                <div
                  v-for="video in extractVideosFromReposts(post)"
                  :key="video.id"
                  class="attachment-video"
                >
                  <a :href="video.link" target="_blank"
                    >Смотреть видео из репоста</a
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useSelectedUsersStore } from "@/stores/selectedUsers";
import { useUserFriendsStore } from "@/stores/userFriends";

export default {
  data() {
    return {
      friend: null, // Информация о друге
      posts: [], // Записи на стене
      sharedUsers: [], // Пользователи, у которых этот друг в друзьях
      loading: true,
      sources: {}, // Источники репостов
    };
  },
  computed: {
    selectedUsers() {
      return this.selectedUsersStore.users; // Пользователи из хранилища выбранных
    },
    allUserFriends() {
      return this.userFriendsStore.friends; // Друзья выбранных пользователей
    },
  },
  async mounted() {
    const friendId = this.$route.params.id;
    await this.fetchFriendDetails(friendId);
  },
  methods: {
    goBack() {
      this.$router.go(-1); // Возвращаемся на предыдущую страницу
    },
    async fetchFriendDetails(friendId) {
      const token = getCookie("access_token");
      if (!token) {
        console.error("Токен отсутствует.");
        return;
      }

      this.loading = true;

      // Получаем информацию о друге
      await new Promise((resolve) => {
        VK.Api.call(
          "users.get",
          {
            user_ids: friendId,
            fields: "photo_200,first_name,last_name",
            access_token: token,
            v: "5.199",
          },
          (response) => {
            if (response.response && response.response[0]) {
              this.friend = response.response[0];
            } else {
              console.error("Ошибка получения данных друга.");
              this.friend = null;
            }
            resolve();
          }
        );
      });

      if (!this.friend) {
        console.error(
          "friend не определен. Запрос users.get вернул пустой ответ."
        );
        this.loading = false;
        return;
      }

      // Проверяем, что данные Pinia определены
      if (!this.selectedUsers || !this.allUserFriends) {
        console.error("selectedUsers или allUserFriends не определены.");
        this.sharedUsers = []; // Обнуляем список
        this.loading = false;
        return;
      }

      // Находим пользователей, у которых данный друг есть в списке
      this.sharedUsers = this.selectedUsers.filter((user) => {
        const userFriends = this.allUserFriends[user.id] || [];
        return userFriends.some((friend) => friend.id === parseInt(friendId));
      });

      // Импорт записей со стены
      await new Promise((resolve) => {
        VK.Api.call(
          "wall.get",
          {
            owner_id: friendId,
            count: 100,
            access_token: token,
            v: "5.199",
          },
          (response) => {
            if (response.response) {
              this.posts = response.response.items || [];
            } else {
              console.error("Ошибка получения записей на стене.");
              this.posts = [];
            }
            resolve();
          }
        );
      });

      this.loading = false;
    },

    async fetchRepostSources(fromIds, token) {
      return new Promise((resolve) => {
        VK.Api.call(
          "users.get",
          {
            user_ids: fromIds.join(","),
            fields: "name",
            access_token: token,
            v: "5.199",
          },
          (response) => {
            if (response.response) {
              response.response.forEach((source) => {
                this.sources[source.id] =
                  source.name || `${source.first_name} ${source.last_name}`;
              });
            } else {
              console.error("Ошибка получения информации о репостах.");
            }
            resolve();
          }
        );
      });
    },

    getRepostSource(fromId) {
      return this.sources[fromId] || "Неизвестный источник";
    },

    extractPhotos(post) {
      if (!post.attachments) return [];
      return post.attachments
        .filter((attachment) => attachment.type === "photo")
        .map((attachment) => ({
          id: attachment.photo.id,
          src: attachment.photo.sizes.pop().url,
        }));
    },

    extractVideos(post) {
      if (!post.attachments) return [];
      return post.attachments
        .filter((attachment) => attachment.type === "video")
        .map((attachment) => ({
          id: attachment.video.id,
          link: `https://vk.com/video${attachment.video.owner_id}_${attachment.video.id}`,
        }));
    },

    extractPhotosFromReposts(post) {
      if (!post.copy_history) return [];
      return post.copy_history.flatMap(
        (repost) =>
          repost.attachments
            ?.filter((attachment) => attachment.type === "photo")
            .map((attachment) => ({
              id: attachment.photo.id,
              src: attachment.photo.sizes.pop().url,
            })) || []
      );
    },

    extractVideosFromReposts(post) {
      if (!post.copy_history) return [];
      return post.copy_history.flatMap(
        (repost) =>
          repost.attachments
            ?.filter((attachment) => attachment.type === "video")
            .map((attachment) => ({
              id: attachment.video.id,
              link: `https://vk.com/video${attachment.video.owner_id}_${attachment.video.id}`,
            })) || []
      );
    },
  },
  setup() {
    const selectedUsersStore = useSelectedUsersStore();
    const userFriendsStore = useUserFriendsStore();
    return {
      selectedUsersStore,
      userFriendsStore,
    };
  },
};
</script>
<style scoped>
.back-button {
  display: inline-block;
  margin: 10px 0 20px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background-color: #0056b3;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
}

.friend-info {
  text-align: center;
  margin-bottom: 20px;
}

.posts-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.post {
  display: flex;
  flex-direction: row; /* Горизонтальная структура */
  align-items: flex-start;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  max-width: 60%; /* Ограничение ширины */
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
  gap: 15px;
}

.post-content {
  flex: 1; /* Занимает доступное пространство */
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start; /* Расположение элементов слева */
}

.photos-container {
  display: flex;
  flex-wrap: wrap; /* Обтекание */
  gap: 10px; /* Расстояние между фотографиями */
}

.videos-container {
  margin-top: 10px;
}

.post-text {
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 10px;
  line-height: 1.5;
  color: #333;
}

.repost-info {
  font-size: 14px;
  font-style: italic;
  color: #777;
}

.attachment-photo {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.attachment-video a {
  display: block;
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
}

.attachment-video a:hover {
  text-decoration: underline;
}
</style>
