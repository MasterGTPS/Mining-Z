// isi dengan config dari Firebase project-mu
const firebaseConfig = {
 apiKey: "AIzaSyCKzrGb2iTb4QIA14pFujCf7j0TMFcf9D0",
  authDomain: "mining-zz.firebaseapp.com",
  databaseURL: "https://mining-zz-default-rtdb.firebaseio.com",
  projectId: "mining-zz",
  storageBucket: "mining-zz.firebasestorage.app",
  messagingSenderId: "751992950328",
  appId: "1:751992950328:web:2323b47fcc3dc6c6a6a0cd",
  measurementId: "G-7JR5CKV56S"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
