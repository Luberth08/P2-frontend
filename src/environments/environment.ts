//ng serve
export const environment = {
  production: false,
  apiUrl: 'https://p2-backend-617x.onrender.com/api/v1',
  wsUrl: 'wss://p2-backend-617x.onrender.com/ws/connect',
  firebase: {
    apiKey: "AIzaSyAvdpjx1YccTHqji2XpwZJX2THnoaXmcOg",
    authDomain: "asistencia-vehicular-890e2.firebaseapp.com",
    projectId: "asistencia-vehicular-890e2",
    storageBucket: "asistencia-vehicular-890e2.firebasestorage.app",
    messagingSenderId: "770812655534",
    appId: "1:770812655534:web:66a5392e14282547623a3f",
    // VAPID key must match backend .env FCM_VAPID_KEY
    vapidKey: 'BAjYPjtTkxxRm-2Pke3A_qNsIR10mRr9DF-bRZS3fWjr78gpYWLEhne08Yf41J4h96Zu2PgA-ic_uWQJXtfnX3o'
  }
};