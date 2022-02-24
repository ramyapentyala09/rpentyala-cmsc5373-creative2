import {routing} from './controller/route.js'
import * as FirebaseAuth from './controller/firebase_auth.js'
import * as HomePage from './viewpage/home_page.js'
import * as UsersPage from './viewpage/users_page.js'
import * as EditProduct from './controller/edit_product.js'


window.onload = () => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    routing(pathname, hash);
}

window.addEventListener('popstate', e => {
    e.preventDefault();
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    routing(pathname, hash);
});

FirebaseAuth.addEventListeners();
HomePage.addEventListeners();
UsersPage.addEventListeners();
EditProduct.addEventListeners();
