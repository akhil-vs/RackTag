const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const vendorDir = path.join(root, "public", "vendor");

const copies = [
  ["node_modules/qrcodejs/qrcode.min.js", "qrcode.min.js"],
  ["node_modules/@zxing/library/umd/index.min.js", "zxing.min.js"],
  ["node_modules/tesseract.js/dist/tesseract.min.js", "tesseract.min.js"],
];

fs.mkdirSync(vendorDir, { recursive: true });

for (const [src, dest] of copies) {
  fs.copyFileSync(path.join(root, src), path.join(vendorDir, dest));
}
