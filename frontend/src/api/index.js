import api from './client';

const data = (promise) => promise.then((res) => res.data);

export const authApi = {
  me: () => data(api.get('/api/auth/me')),
  // Spring Security form login: urlencoded "email" + "password"
  login: (email, password) => data(api.post('/api/auth/login', new URLSearchParams({ email, password }))),
  logout: () => api.post('/api/auth/logout'),
  register: (formData) => data(api.post('/api/auth/register', formData)),
};

export const userApi = {
  get: (userId) => data(api.get(`/api/users/${userId}`)),
  // type: companion | friend | travelplan
  search: (keyword, type) => data(api.get('/api/search', { params: { keyword, type } })),
  featuredPackages: () => data(api.get('/api/static-plans/featured')),
  updateProfile: (formData) => data(api.put('/api/users/me', formData)),
  stats: (userId) => data(api.get(`/api/users/${userId}/stats`)),
};

export const travelApi = {
  // params: interest, from, to, openOnly, hideEnded, page, size -> { content, page }
  explore: (params) => data(api.get('/api/travel', { params })),
  mine: () => data(api.get('/api/travel/mine')),
  get: (id) => data(api.get(`/api/travel/${id}`)),
  create: (plan) => data(api.post('/api/travel', plan)),
  update: (id, plan) => data(api.put(`/api/travel/${id}`, plan)),
  myJoinedUsers: () => data(api.get('/api/travel/my-joined-users')),
  join: (id, message) => data(api.post(`/api/travel/${id}/join`, { message })),
  remove: (id) => api.delete(`/api/travel/${id}`),
  leave: (id) => data(api.post(`/api/travel/${id}/leave`)),
  removeCompanion: (id, userId) => data(api.post(`/api/travel/${id}/companions/${userId}/remove`)),
  uploadCover: (id, formData) => data(api.post(`/api/travel/${id}/cover`, formData)),
  removeCover: (id) => data(api.delete(`/api/travel/${id}/cover`)),
};

export const requestApi = {
  pending: () => data(api.get('/api/requests/pending')),
  sent: () => data(api.get('/api/requests/sent')),
  respond: (requestId, action) => data(api.post(`/api/requests/${requestId}/respond`, { action })),
  cancel: (requestId) => data(api.post(`/api/requests/${requestId}/cancel`)),
};

export const friendApi = {
  list: () => data(api.get('/api/friends')),
  pending: () => data(api.get('/api/friends/pending')),
  sendRequest: (recipientId) => data(api.post('/api/friends/request', { recipientId })),
  accept: (friendshipId) => data(api.post(`/api/friends/${friendshipId}/accept`)),
  reject: (friendshipId) => data(api.post(`/api/friends/${friendshipId}/reject`)),
  block: (userId) => data(api.post('/api/friends/block', { userId })),
  unfriend: (userId) => data(api.delete(`/api/friends/${userId}`)),
  blocked: () => data(api.get('/api/friends/blocked')),
  unblock: (userId) => data(api.post('/api/friends/unblock', { userId })),
  // { status: NONE | FRIENDS | PENDING_SENT | PENDING_RECEIVED | BLOCKED | BLOCKED_BY_OTHER, friendshipId }
  status: (userId) => data(api.get(`/api/friends/status/${userId}`)),
};

export const messageApi = {
  conversation: (userId) => data(api.get(`/api/messages/conversation/${userId}`)),
  unread: () => data(api.get('/api/messages/unread')),
  markRead: (messageId) => api.put(`/api/messages/${messageId}/read`),
  community: (page, size) => data(api.get('/api/messages/community', { params: { page, size } })),
};

export const adminApi = {
  stats: () => data(api.get('/api/admin/stats')),
  users: (params) => data(api.get('/api/admin/users', { params })),
  setRole: (userId, role) => data(api.patch(`/api/admin/users/${userId}/role`, { role })),
  setEnabled: (userId, enabled) => data(api.patch(`/api/admin/users/${userId}/status`, { enabled })),
  travelPlans: (params) => data(api.get('/api/admin/travel-plans', { params })),
  deleteTravelPlan: (travelId) => api.delete(`/api/admin/travel-plans/${travelId}`),
  communityMessages: (params) => data(api.get('/api/admin/community-messages', { params })),
  deleteCommunityMessage: (id) => api.delete(`/api/admin/community-messages/${id}`),
  staticPlans: () => data(api.get('/api/admin/static-plans')),
  createStaticPlan: (formData) => data(api.post('/api/admin/static-plans', formData)),
  setFeatured: (id, featured) => data(api.patch(`/api/admin/static-plans/${id}/featured`, { featured })),
  deleteStaticPlan: (id) => api.delete(`/api/admin/static-plans/${id}`),
};
