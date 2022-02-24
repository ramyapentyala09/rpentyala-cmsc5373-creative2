import { 
    getAuth, signInWithEmailAndPassword, signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.5/firebase-auth.js"
const auth = getAuth();

import * as Elements from '../viewpage/elements.js'
import * as Constants from '../model/constants.js'
import * as Util from '../viewpage/util.js'
import { routing } from "./route.js";
import * as WelcomeMessage from "../viewpage/welcome_message.js"

export let currentUser = null;

export function addEventListeners() {

Elements.formSignin.addEventListener('submit', async e => {
e.preventDefault();
const email = e.target.email.value;
const password = e.target.password.value;

if (!Constants.adminEmails.includes(email)) {
    Util.info('Error', 'Only for admins', Elements.modalSignin);
    return;
}
try {
await signInWithEmailAndPassword(auth, email, password);
Elements.modalSignin.hide();
console.log('sign in')
} catch (e) {
if (Constants.DEV) console.log(e);
Util.info('Sign In Error', JSON.stringify(e), Elements.modalSignin);
}
});
Elements.menuSignout.addEventListener('click', async () => {
    try{
await signOut(auth);
document.getElementById('productView').style.display = 'none'
console.log('Signed out')
    } catch (e) {
if (Constants.DEV) console.log(e);
Util.info('Sign out error: Try again', JSON.stringify(e));
    }
});
onAuthStateChanged(auth, authStateChanged);
}
function authStateChanged(user) {
    if (user && Constants.adminEmails.includes(user.email)) {
currentUser = user;
let elements = document.getElementsByClassName('modal-preauth');
for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = 'none';
}
elements = document.getElementsByClassName('modal-postauth');
for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = 'block'; 
}
const pathname = window.location.pathname;
const hash = window.location.hash;
routing(pathname, hash);

    } else {
currentUser = null;
let elements = document.getElementsByClassName('modal-preauth');
for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = 'block';
}
elements = document.getElementsByClassName('modal-postauth');
for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = 'none'; 
}
Elements.root.innerHTML = WelcomeMessage.html;
    }
}