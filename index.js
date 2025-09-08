const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendChatNotification = functions.firestore
    .document('messages/{messageId}')
    .onCreate(async (snapshot, context) => {
        const message = snapshot.data();
        
        // Don't send notification if user sent the message to themselves
        if (message.senderId === message.receiverId) return null;
        
        // Get the recipient's FCM token
        const recipientTokenDoc = await admin.firestore()
            .collection('fcm_tokens')
            .doc(message.receiverId)
            .get();
            
        if (!recipientTokenDoc.exists) return null;
        
        const token = recipientTokenDoc.data().token;
        
        // Notification content
        const payload = {
            notification: {
                title: `New message from ${message.senderName || 'Someone'}`,
                body: message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text,
                icon: '/icon-192.png',
                click_action: 'https://yourdomain.com' // Your app URL
            }
        };
        
        // Send notification
        return admin.messaging().sendToDevice(token, payload);
    });