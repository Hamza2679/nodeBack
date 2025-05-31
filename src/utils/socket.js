// const GroupService = require('../services/groupService');
// const GroupPostService = require('../services/groupPostService');
// const UserService = require('../services/UserService');

// const userConnectionCount = new Map();
// const activeSockets = new Map();

// function handleGroupSocket(io, socket) {
//   const userId = socket.user?.id;
//   if (!userId) {
//     console.error("No userId found on socket. Disconnecting...");
//     return socket.disconnect();
//   }

//   console.log("🔌 Group Socket connected:", socket.id, "User ID:", userId);

//   // Track user connections
//   const prevCount = userConnectionCount.get(userId) || 0;
//   userConnectionCount.set(userId, prevCount + 1);

//   if (!activeSockets.has(userId)) {
//     activeSockets.set(userId, new Set());
//   }
//   activeSockets.get(userId).add(socket.id);

//   socket.on('join_group', (groupId) => {
//     console.log(`User ${userId} joining group ${groupId}`);
//     socket.join(`group_${groupId}`);
//   });

//   socket.on('new_group_post', async (postData) => {
//     try {
//       const newPost = await GroupPostService.create(
//         postData.groupId,
//         userId,
//         postData.text,
//         postData.imageUrl || null
//       );

//       const user = await UserService.getUserById(userId);
//       if (!user) throw new Error('User not found');

//       const postResponse = {
//         id: newPost.id,
//         groupId: newPost.group_id,
//         userId: newPost.user_id,
//         text: newPost.text,
//         imageUrl: newPost.image_url,
//         createdAt: newPost.created_at,
//         user: {
//           id: user.id,
//           firstName: user.first_name,
//           lastName: user.last_name,
//           profilePicture: user.profilepicture,
//           role: user.role
//         }
//       };

//       io.to(`group_${postData.groupId}`).emit('new_group_post', postResponse);
//     } catch (err) {
//       console.error('Error handling new_group_post:', err);
//       socket.emit('post_error', {
//         message: 'Failed to create post',
//         tempId: postData.tempId
//       });
//     }
//   });

//   socket.on('updated_group_post', async (postData) => {
//     try {
//       const updatedPost = await GroupPostService.update(
//         postData.id,
//         userId,
//         postData.text,
//         postData.imageUrl || null
//       );

//       if (!updatedPost) throw new Error('Post not found');

//       const user = await UserService.getUserById(userId);
//       if (!user) throw new Error('User not found');

//       const postResponse = {
//         id: updatedPost.id,
//         groupId: updatedPost.group_id,
//         userId: updatedPost.user_id,
//         text: updatedPost.text,
//         imageUrl: updatedPost.image_url,
//         createdAt: updatedPost.created_at,
//         updatedAt: updatedPost.updated_at,
//         user: {
//           id: user.id,
//           firstName: user.first_name,
//           lastName: user.last_name,
//           profilePicture: user.profilepicture,
//           role: user.role
//         }
//       };

//       io.to(`group_${postData.groupId}`).emit('updated_group_post', postResponse);
//     } catch (err) {
//       console.error('Error handling updated_group_post:', err);
//     }
//   });

//   socket.on('deleted_group_post', async (data) => {
//     try {
//       const isAdmin = await GroupService.isAdmin(data.groupId, userId);
//       const isPostOwner = await GroupPostService.isOwner(data.postId, userId);

//       if (!isAdmin && !isPostOwner) {
//         throw new Error('Unauthorized to delete post');
//       }

//       await GroupPostService.delete(data.postId, userId);

//       io.to(`group_${data.groupId}`).emit('deleted_group_post', {
//         postId: data.postId
//       });
//     } catch (err) {
//       console.error('Error handling deleted_group_post:', err);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log(`Socket disconnected: ${socket.id}`);
//     if (userId) {
//       const count = userConnectionCount.get(userId) || 1;
//       if (count <= 1) {
//         userConnectionCount.delete(userId);
//         activeSockets.delete(userId);
//       } else {
//         userConnectionCount.set(userId, count - 1);
//         activeSockets.get(userId).delete(socket.id);
//       }
//     }
//   });

//   socket.on('reconnect_attempt', () => {
//     console.log(`Reconnect attempt by ${socket.id}`);
//     socket.emit('reconnect_status', { attempting: true });
//   });
// }

// module.exports = {
//   handleGroupSocket,
//   getActiveSockets: () => activeSockets,
//   getUserConnectionCount: () => userConnectionCount,
// };
