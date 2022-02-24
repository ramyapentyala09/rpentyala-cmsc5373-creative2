export class Product {
    constructor(data) {
        if (data) {

            this.name = data.name.toLowerCase().trim();
            this.price = typeof data.price == 'number' ? data.price : Number(data.price);
            this.summary = data.summary.trim();
            this.imageName = data.imageName;
            this.imageURL = data.imageURL;
        }
    }

    set_docId(id) {
        this.docId = id;
    }

    toFirestore() {
        return {
            name: this.name,
            price: this.price,
            summary: this.summary,
            imageName: this.imageName,
            imageURL: this.imageURL,
        }
    }
    toFirestoreForUpdate() {
        const p = {};
        if (this.name) p.name = this.name;
        if (this.price) p.price = this.price;
        if (this.summary) p.summary = this.summary;
        if (this.imageName) p.imageName = this.imageName;
        if (this.imageURL) p.imageURL = this.imageURL;
        return p;
    }
}