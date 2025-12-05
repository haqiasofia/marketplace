require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { authenticateToken, authorizeRole } = require("./auth/auth");
const jwt = require("jsonwebtoken");

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
    const hargaFinal =
      item.pricing.base_price + item.pricing.tax;

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

// Endpoint untuk Vendor C
// GET - untuk semua produk vendor C
app.get('/vendor/c', (req, res) => {
  res.json(vendorC);
});

// POST - untuk menambahkan produk baru
app.post('/vendor/c', (req, res) => {
  const newProduct = {
    id: req.body.id || (vendorC.length ? vendorC[vendorC.length - 1].id + 1 : 501),
    details: {
      name: req.body.details.name,
      category: req.body.details.category
    },
    pricing: {
      base_price: req.body.pricing.base_price,
      tax: req.body.pricing.tax
    },
    stock: req.body.stock
  };

  vendorC.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT - untuk mengupdate produk berdasarkan ID
app.put('/vendor/c/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = vendorC.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Produk tidak ditemukan" });
  }

  vendorC[index] = {
    ...vendorC[index],
    ...req.body,
    details: {
      ...vendorC[index].details,
      ...req.body.details
    },
    pricing: {
      ...vendorC[index].pricing,
      ...req.body.pricing
    }
  };

  res.json(vendorC[index]);
});

// DELETE - untuk menghapus produk berdasarkan ID
app.delete('/vendor/c/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = vendorC.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Produk tidak ditemukan" });
  }

  const deleted = vendorC.splice(index, 1);
  res.json(deleted[0]);
});

//-----------------------------------

function getAllProducts() {
  return [
    ...normalizeVendorB(vendorB),
    ...normalizeVendorC(vendorC)
  ];
}


app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Dummy user (bisa nanti kamu ambil dari database)
  const users = [
    { id: 1, username: "admin", password: "admin123", role: "admin" },
    { id: 2, username: "user", password: "user123", role: "user" }
  ];

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Username atau password salah" });
  }

  const token = jwt.sign(
    { user: { id: user.id, username: user.username, role: user.role }},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ message: "Login berhasil", token });
});




app.get("/", (req, res) => {
  res.send("Integrator API berjalan dengan baik!");
});


app.get("/product", authenticateToken, (req, res) => {
  res.json(getAllProducts());
});


app.get("/vendor/b", authenticateToken, (req, res) => {
  res.json(normalizeVendorB(vendorB));
});


app.get("/vendor/c", authenticateToken, (req, res) => {
  res.json(normalizeVendorC(vendorC));
});


app.get("/products/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const found = getAllProducts().find((item) => String(item.id) === id);

  if (!found) {
    return res.status(404).json({ error: "Produk tidak ditemukan" });
  }
  res.json(found);
});


app.get("/admin/dashboard",
  authenticateToken,
  authorizeRole("admin"),
  (req, res) => {
    res.json({ message: "Selamat datang Admin!", user: req.user });
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
