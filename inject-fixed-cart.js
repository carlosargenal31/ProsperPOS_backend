// Script to inject fixed cart with category_id and subcategory_id

const fixedCart = [
  {
    product_id: 1017,
    code: "FF-0051-9",
    name: "CERAMICA 46014 46X46CM (1.90MT2-9PZS)",
    image: "https://storage.googleapis.com/prosperpos-images/products/product_1017_main.jpeg",
    category: "CERAMICA PARA PISO",
    category_id: 4,
    subcategory: "CERAMICAS 46X46CM",
    subcategory_id: 22,
    brand: "KARINA",
    price: "360.00",
    tax_rate: 15,
    quantity: 10,
    unit: "MT.2"
  },
  {
    product_id: 128,
    code: "C-0128-9",
    name: "CERAMICA BAñO MENORCA AZUL LISA 25X33CM (1.42MT2-17PZS)",
    image: "https://ferrebaratilloimage.s3.us-east-2.amazonaws.com/115966.png",
    category: "PAREDES",
    category_id: 2,
    subcategory: "PAREDES BAÑO 25X33CM",
    subcategory_id: 10,
    brand: "HISPACENSA",
    price: "350.00",
    tax_rate: 15,
    quantity: 10,
    unit: "MT.2"
  }
];

console.log('Fixed cart to inject:');
console.log(JSON.stringify(fixedCart, null, 2));
