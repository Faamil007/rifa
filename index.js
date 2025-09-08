const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Send push notification when a new message is created
exports.sendPushNotification = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    
    // Don't send notification if the sender is the current user
    if (message.senderId === message.receiverId) return null;
    
    // Get the recipient's push token
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(message.receiverId)
      .get();
      
    const pushToken = userDoc.data().pushToken;
    
    if (!pushToken) return null;
    
    // Notification content
    const payload = {
      notification: {
        title: 'New message',
        body: message.text,
        icon: '/icon.png'
      }
    };
    
    // Send the notification
    return admin.messaging().sendToDevice(pushToken, payload);
  });