import {
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject
 } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-storage.js"

 import * as Constants from '../model/constants.js'

 const storage = getStorage();

 export async function uploadImage(imageFile, imageName){
     if (!imageName) {
         imageName = imageFile.name + Date.now();

     }

     const storageRef = ref(storage, Constants.STORAGEFOLDERNAMES.PRODUCT_IMAGES + imageName);
     const snapshot = await uploadBytes(storageRef, imageFile);
     const imageURL = await getDownloadURL(snapshot.ref);
 
     return{imageName, imageURL};
 }

 export async function deleteProductImage(imageName) {
    const storageRef = ref(storage, Constants.STORAGEFOLDERNAMES.PRODUCT_IMAGES + imageName);
    await deleteObject(storageRef);
 }