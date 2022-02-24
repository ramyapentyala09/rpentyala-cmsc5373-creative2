import * as Elements from './elements.js'
import { routePathnames } from '../controller/route.js';
import { currentUser } from '../controller/firebase_auth.js';
import { Product } from '../model/product.js';
import * as CloudFunctions from '../controller/cloud_functions.js'
import * as Util from './util.js'
import * as Constants from '../model/constants.js'
import * as CloudStorage from '../controller/cloud_storage.js'
import * as EditProduct from '../controller/edit_product.js'

let imageFile2Upload = null;

let loader = `<div style="text-align: center">
<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
</div>
</div>`

export function addEventListeners() {
    Elements.menuHome.addEventListener('click', async () => {
        history.pushState(null, null, routePathnames.HOME);
        const button = Elements.menuHome;
        const label = Util.disableButton(button);
        await home_page();
        // await Util.sleep(1000)
        Util.enableButton(button, label);
    });
    Elements.formAddProduct.imageButton.addEventListener('change', e => {
        imageFile2Upload = e.target.files[0];
        if (!imageFile2Upload) {
            Elements.formAddProduct.imageTag.removeAttribute('src');
            return;

        }
        const reader = new FileReader();
        reader.readAsDataURL(imageFile2Upload);
        reader.onload = () => Elements.formAddProduct.imageTag.src = reader.result;
    });
    Elements.formAddProduct.form.addEventListener('submit', addNewProduct);
    document.getElementById('searchBtn').addEventListener('click', getProductBySearching)
    document.getElementById('priceBox').addEventListener('change', getProductByPricing)
    document.getElementById('priceRange').addEventListener('change', getProductByPricingRange)

}

export async function home_page() {
    if (!currentUser) {
        Elements.root.innerHTML = '<h1>Protected Page</h1>'
        return;
    }
    document.getElementById('productView').style.display = 'flex'

    let products;

    try {
        products = await CloudFunctions.getProductList();
    } catch (e) {
        if (Constants.DEV) console.log(e);
        Util.info('Cannot get product List', JSON.stringify(e));

        return;

    }

    let element = document.createElement('div')
    element.id = "productList"

    products.forEach(p => {
        element.innerHTML += buildProductCard(p);
    });

    Elements.root.innerHTML = ''
    Elements.root.innerHTML += element.outerHTML


    const forms = document.getElementsByClassName('form-edit-delete-product');
    for (let i = 0; i < forms.length; i++) {
        forms[i].addEventListener('submit', async e => {
            e.preventDefault();
            const buttons = e.target.getElementsByTagName('button');
            const submitter = e.target.submitter;
            if (submitter == 'EDIT') {
                const label = Util.disableButton(buttons[0]);
                await EditProduct.edit_product(e.target.docId.value);
                //await Util.sleep(1000)
                Util.enableButton(buttons[0], label);
            } else if (submitter == 'DELETE') {
                const label = Util.disableButton(buttons[1]);
                await EditProduct.delete_product(e.target.docId.value, e.target.imageName.value);
                // await Util.sleep(1000)
                Util.enableButton(buttons[1], label);
            } else {
                console.log('No such submitter', submitter);
            }

        })
    }
}
async function addNewProduct(e) {
    e.preventDefault();
    const name = e.target.name.value.toLowerCase();
    const price = Number(e.target.price.value);
    const summary = e.target.summary.value;

    const product = new Product({ name, price, summary });

    const button = e.target.getElementsByTagName('button')[0];
    const label = Util.disableButton(button);

    try {
        //upload the product image => imageName, imageURL
        const { imageName, imageURL } = await CloudStorage.uploadImage(imageFile2Upload);
        product.imageName = imageName;
        product.imageURL = imageURL;
        const docId = await CloudFunctions.addProduct(product.toFirestore());
        Util.info('Sucsess!', `Added: ${product.name} added!, docId = ${docId}`, Elements.modalAddProduct);
        e.target.reset();
        Elements.formAddProduct.imageTag.removeAttribute('src');
        await home_page(); // you may improve later
    } catch (e) {
        if (Constants.DEV) console.log(e);
        Util.info('Add product failed', `${e.code}: ${e.name} - ${e.message}`, Elements.modalAddProduct);

    }
    Util.enableButton(button, label);
}

async function getProductBySearching() {
    document.getElementById('productList').innerHTML = loader
    let text = document.getElementById('searchBox').value

    let products;

    try {
        products = !!text ? await CloudFunctions.getProductListBySearch(text.toLowerCase()) : await CloudFunctions.getProductList();
    } catch (e) {
        if (Constants.DEV) console.log(e);
        Util.info('Cannot get product List by searching', JSON.stringify(e));

        return;

    }
    document.getElementById('productList').innerHTML = ''

    products.forEach(p => {
        document.getElementById('productList').innerHTML += buildProductCard(p);
    });

    document.getElementById('priceRange').disabled = !!text
    document.getElementById('priceBox').disabled = !!text

    if (!products.length) {
        document.getElementById('productList').innerHTML = '<h2>No Products</h2>'
    }
}

async function getProductByPricing() {
    document.getElementById('productList').innerHTML = loader
    let priceVal = document.getElementById('priceBox').value

    let products;

    try {
        products = !isNaN(priceVal) ? await CloudFunctions.getProductListByPrice(priceVal) : await CloudFunctions.getProductList();
    } catch (e) {
        if (Constants.DEV) console.log(e);
        Util.info('Cannot get product List by pricing', JSON.stringify(e));

        return;

    }
    document.getElementById('productList').innerHTML = ''

    products.forEach(p => {
        document.getElementById('productList').innerHTML += buildProductCard(p);
    });

    document.getElementById('searchBox').value = ''
    document.getElementById('priceRange').disabled = !isNaN(priceVal)

    if (!products.length) {
        document.getElementById('productList').innerHTML = '<h2>No Products</h2>'
    }
}

async function getProductByPricingRange() {
    document.getElementById('productList').innerHTML = loader
    let priceRangeVal = document.getElementById('priceRange').value

    let products;

    try {
        products = !isNaN(priceRangeVal) ? await CloudFunctions.getProductListByPriceRange(priceRangeVal) : await CloudFunctions.getProductList();
    } catch (e) {
        if (Constants.DEV) console.log(e);
        Util.info('Cannot get product List by pricing range', JSON.stringify(e));

        return;

    }
    document.getElementById('productList').innerHTML = ''

    products.forEach(p => {
        document.getElementById('productList').innerHTML += buildProductCard(p);
    });

    document.getElementById('searchBox').value = ''
    document.getElementById('priceBox').disabled = !isNaN(priceRangeVal)

    if (!products.length) {
        document.getElementById('productList').innerHTML = '<h2>No Products</h2>'
    }
}

function buildProductCard(product) {
    return `
    <div id='card-${product.docId}' class="card d-table-cell" style="width: 18rem;">
    <img src="${product.imageURL}" class="card-img-top" >
    <div class="card-body">
      <h5 class="card-title">${product.name}</h5>
      <p class="card-text">$${product.price.toFixed(2)}<br>${product.summary}</p>
      <form class="form-edit-delete-product" method="post">
      <input type="hidden" name="docId" value="${product.docId}">
      <input type="hidden" name="imageName" value="${product.imageName}">
      <button type="submit" class="btn btn-outline-primary"
        onclick="this.form.submitter='EDIT'">Edit</button>
      <button type="submit" class="btn btn-outline-danger"
      onclick="this.form.submitter='DELETE'">Delete</button>

      </form>
    </div>
    </div>
    `;
}