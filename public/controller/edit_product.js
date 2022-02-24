import * as CloudFunctions from '../controller/cloud_functions.js'
import * as CloudStorage from '../controller/cloud_storage.js'
import * as Util from '../viewpage/util.js'
import * as Constants from '../model/constants.js'
import * as Elements from '../viewpage/elements.js'
import { Product } from '../model/product.js'
import { home_page } from "../viewpage/home_page.js";

let imageFile2Upload;
let product;

export function addEventListeners(){

    Elements.formEditProduct.imageButton.addEventListener('change', e => {
        imageFile2Upload = e.target.files[0];
        if(!imageFile2Upload){
            Elements.formEditProduct.imageTag.removeAttribute('src');
            alert('Image selection canceled. Image will not be uploaded');
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(imageFile2Upload);
        reader.onload = () => Elements.formEditProduct.imageTag.src = reader.result;

    })

    Elements.formEditProduct.form.addEventListener('submit', async e => {
        e.preventDefault();
        const button = e.target.getElementsByTagName('button')[0];
    const label = Util.disableButton(button);

    const newName = e.target.name.value;
    const newPrice = e.target.price.value;
    const newSummary = e.target.summary.value;
    const update = new Product();
    update.docId = e.target.docId.value;
    if (newName != product.name) update.name = newName;
    if (newPrice != product.price) update.price = Number(newPrice);
    if (newSummary != product.summary) update.summary = newSummary;

    try {
if (imageFile2Upload) {
    const imageInfo = await CloudStorage.uploadImage(imageFile2Upload, e.target.imageName.value);
    update.imageURL = imageInfo.imageURL;
}
await CloudFunctions.updateProductDoc(update);

const cardTag = document.getElementById(`card-${product.docId}`);
if (imageFile2Upload) {
cardTag.getElementsByTagName('img')[0].src = update.imageURL;

}
if (update.name) {
    cardTag.getElementsByClassName('card-title')[0].innerHTML = update.name;

}
if (update.price || update.summary) {
    cardTag.getElementsByClassName('card-text')[0].innerHTML = `
    $ ${update.price ? update.price : product.price}<br>
    ${update.summary ? update.summary : product.summary}
    `;
}
const info =`Update: ${update.name ? 'name' : ''} ${update.price ? 'price' : ''}
${update.summary ? 'summary' : ''} ${imageFile2Upload ? 'image' : ''}
`;
Util.info('Update Success!', info, Elements.modalEditProduct);
await home_page();
    } catch (e) {
if (Constants.DEV) console.log(e);
Util.info('Update product error!', JSON.stringify(e), Elements.modalEditProduct);
    }
    
    
    Util.enableButton(button, label);
    
    
    })

}

export async function edit_product(docId) {
    
    try {
        product = await CloudFunctions.getProductById(docId);
        if(!product) {
            Util.info('getProductById error', 'No product found by id');
            return;
        }
    } catch (e) {
        if(Constants.DEV) console.log(e);
        Util.info('getProductById error', JSON.stringify(e));
        return;
        
    }

    //show product
    Elements.formEditProduct.form.docId.value = product.docId;
    Elements.formEditProduct.form.imageName.value = product.imageName;
    Elements.formEditProduct.form.name.value = product.name;
    Elements.formEditProduct.form.price.value = product.price;
    Elements.formEditProduct.form.summary.value = product.summary;
    Elements.formEditProduct.imageTag.src = product.imageURL;
    Elements.formEditProduct. imageButton.value = null;
    imageFile2Upload = null;

    Elements.modalEditProduct.show();
}

export async function delete_product(docId, imageName) {
    // 1. delete doc, 2. delete image
    const r = confirm('Press OK to delete');
    if (!r) return;
    try {
        await CloudFunctions.deleteProductDoc(docId);
        await CloudStorage.deleteProductImage(imageName);
        document.getElementById(`card-${docId}`).remove();
        Util.info('Deleted', `${docId} has been deleted`);
    } catch (e) {
        if (Constants.DEV) console.log(e);
        Util.info('Delete product error', JSON.stringify(e));

    }

}