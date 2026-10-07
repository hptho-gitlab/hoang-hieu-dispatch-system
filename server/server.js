require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ',
  });
});

async function startServer() {
  await mongoose.connect(process.env.MONGO_URI);
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server đang chạy tại cổng ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Không thể khởi động máy chủ:', error);
    process.exit(1);
  });
}

module.exports = { app, startServer };
