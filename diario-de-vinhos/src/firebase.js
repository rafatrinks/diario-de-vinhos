// ⚠️ SUBSTITUA os valores abaixo pelas suas credenciais do Firebase
// Veja o passo a passo no arquivo LEIA-ME.txt

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDuy1Vt2xQbYoq3mPlugoCgm3rbHPNwc6E",
  authDomain: "diario-de-vinhos.firebaseapp.com",
  projectId: "diario-de-vinhos",
  storageBucket: "diario-de-vinhos.firebasestorage.app",
  messagingSenderId: "311038292826",
  appId: "1:311038292826:web:f580e37f53c60302cef963"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
