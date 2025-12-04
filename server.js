require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());


const vendorB = require("./vendorB.json");
const vendorC = require("./vendorC.json");


function normalizeVendorB(data) {
  return data.map((item) => ({
    id: item.sku,
    name: item.productName,
    price: item.price,
    stock: item.isAvailable ? "Tersedia" : "Habis",
    vendor: "Vendor B",
  }));
}


function normalizeVendorC(data) {
  return data.map((item) => {
    const hargaFinal = item.pricing.base_price + item.pricing.tax;

    let name = item.details.name;
    if (item.details.category === "Food") {
      name += " (Recommended)";
    }

    return {
      id: item.id,
      name,
      price: hargaFinal,
      stock: item.stock,
      vendor: "Vendor C",
    };
  });
}


function getAllProducts() {
  const b = normalizeVendorB(vendorB);
  const c = normalizeVendorC(vendorC);
  return [...b, ...c];
}


app.get("/", (req, res) => {
  res.send("Integrator API berjalan dengan baik!");
});


app.get("/products", (req, res) => {
  res.json(getAllProducts());
});


app.get("/vendor/b", (req, res) => {
  res.json(normalizeVendorB(vendorB));
});


app.get("/vendor/c", (req, res) => {
  res.json(normalizeVendorC(vendorC));
});


app.get("/products/:id", (req, res) => {
  const id = req.params.id;
  const all = getAllProducts();
  const found = all.find((item) => String(item.id) === id);

  if (!found) {
    return res.status(404).json({ error: "Produk tidak ditemukan" });
  }
  res.json(found);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
