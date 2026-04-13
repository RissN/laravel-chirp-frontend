/**
 * Module: tweets.ts
 *
 * Service layer API untuk operasi tweet/postingan.
 * Menyediakan fungsi-fungsi async untuk berkomunikasi dengan
 * backend Laravel API melalui Axios HTTP client.
 * Setiap fungsi mengembalikan Promise dengan tipe response yang sesuai.
 */
import api from './axios';
import type { ApiResponse, PaginatedResponse, Tweet } from '../types';

/**
 * Mengambil timeline/beranda user yang sedang login.
 * Menampilkan tweet dari user yang di-follow dan tweet sendiri.
 *
 * @param page - Nomor halaman untuk pagination (default: 1)
 * @returns Promise berisi daftar tweet dengan metadata pagination
 */
export const getTimeline = async (page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/tweets?page=${page}`);
  return data;
};

/**
 * Mengambil feed "For You" — tweet populer dari seluruh platform.
 * Diurutkan berdasarkan engagement (likes + retweets + views).
 *
 * @param page - Nomor halaman untuk pagination (default: 1)
 * @returns Promise berisi daftar tweet populer
 */
export const getForYouTimeline = async (page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/tweets/for-you?page=${page}`);
  return data;
};

/**
 * Mengambil tweet dari halaman Explore.
 * Menampilkan tweet populer dari seluruh platform.
 *
 * @param page - Nomor halaman untuk pagination (default: 1)
 * @returns Promise berisi daftar tweet populer
 */
export const getExplore = async (page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/tweets/explore?page=${page}`);
  return data;
};

/**
 * Mengambil detail satu tweet berdasarkan ID.
 * Setiap pemanggilan menambah counter views pada backend.
 *
 * @param id - ID tweet yang ingin dilihat
 * @returns Promise berisi data lengkap tweet
 */
export const getTweetDetail = async (id: number): Promise<ApiResponse<Tweet>> => {
  const { data } = await api.get(`/tweets/${id}`);
  return data;
};

/**
 * Mengambil daftar reply/komentar dari suatu tweet.
 *
 * @param id - ID tweet induk
 * @param page - Nomor halaman pagination (default: 1)
 * @returns Promise berisi daftar reply dengan pagination
 */
export const getTweetReplies = async (id: number, page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/tweets/${id}/replies?page=${page}`);
  return data;
};

/**
 * Membuat tweet baru.
 * Konten maksimum 250 karakter, media maksimum 4 lampiran.
 *
 * @param tweetData - Objek berisi content (teks) dan media (array URL)
 * @returns Promise berisi data tweet yang baru dibuat
 */
export const createTweet = async (tweetData: {content?: string, media?: string[]}): Promise<ApiResponse<Tweet>> => {
  const { data } = await api.post('/tweets', tweetData);
  return data;
};

/**
 * Mengirim reply/komentar pada tweet tertentu.
 * Menggunakan validasi yang sama dengan createTweet (maks 250 karakter).
 *
 * @param id - ID tweet yang dibalas
 * @param tweetData - Objek berisi content dan media
 * @returns Promise berisi data reply yang baru dibuat
 */
export const replyToTweet = async (id: number, tweetData: {content?: string, media?: string[]}): Promise<ApiResponse<Tweet>> => {
  const { data } = await api.post(`/tweets/${id}/reply`, tweetData);
  return data;
};

/**
 * Toggle like/unlike pada tweet.
 * Jika sudah di-like maka unlike, dan sebaliknya.
 *
 * @param id - ID tweet yang di-like/unlike
 * @returns Promise berisi status like terbaru dan jumlah likes
 */
export const toggleLike = async (id: number): Promise<ApiResponse<{is_liked: boolean, likes_count: number}>> => {
  const { data } = await api.post(`/tweets/${id}/like`);
  return data;
};

/**
 * Toggle retweet/unretweet pada tweet.
 * Jika sudah di-retweet maka unretweet, dan sebaliknya.
 *
 * @param id - ID tweet yang di-retweet
 * @returns Promise berisi status retweet terbaru dan jumlah retweets
 */
export const toggleRetweet = async (id: number): Promise<ApiResponse<{is_retweeted: boolean, retweets_count: number}>> => {
  const { data } = await api.post(`/tweets/${id}/retweet`);
  return data;
};

/**
 * Toggle bookmark/unbookmark pada tweet.
 * Jika sudah di-bookmark maka unbookmark, dan sebaliknya.
 *
 * @param id - ID tweet yang di-bookmark
 * @returns Promise berisi status bookmark terbaru dan jumlah bookmarks
 */
export const toggleBookmark = async (id: number): Promise<ApiResponse<{is_bookmarked: boolean, bookmarks_count: number}>> => {
  const { data } = await api.post(`/tweets/${id}/bookmark`);
  return data;
};

/**
 * Mengupdate/mengedit tweet yang sudah ada.
 * Hanya pemilik tweet yang dapat mengedit.
 *
 * @param id - ID tweet yang akan diupdate
 * @param tweetData - Objek berisi content baru dan media
 * @returns Promise berisi data tweet yang sudah diperbarui
 */
export const updateTweet = async (id: number, tweetData: {content?: string, media?: string[] | null}): Promise<ApiResponse<Tweet>> => {
  const { data } = await api.put(`/tweets/${id}`, tweetData);
  return data;
};

/**
 * Menghapus tweet berdasarkan ID.
 * Hanya pemilik tweet yang dapat menghapus.
 * Media terkait juga akan dihapus dari server storage.
 *
 * @param id - ID tweet yang akan dihapus
 * @returns Promise berisi konfirmasi penghapusan
 */
export const deleteTweet = async (id: number): Promise<ApiResponse<void>> => {
  const { data } = await api.delete(`/tweets/${id}`);
  return data;
};
