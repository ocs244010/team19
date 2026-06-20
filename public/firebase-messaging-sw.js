importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD3f_OWlNE1FKL_dSITuNLh6_jBAyOOQDc",
  projectId: "team-19-33519",
  messagingSenderId: "631147657703",
  appId: "1:631147657703:web:793918f50f83db17a36542"
});

const messaging = firebase.messaging();
