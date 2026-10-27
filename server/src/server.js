import app from './app.js';
import { env } from './config/env.js';
import { initDatabase, prisma } from './config/db.js';

async function startServer() {
  try {
    // Initialize Database
    await initDatabase();

    const server = app.listen(env.port, () => {
      console.log('==================================================');
      console.log(`🚀 WorkManager Server đang chạy tại: http://localhost:${env.port}`);
      console.log(`📡 API Base URL: http://localhost:${env.port}/api`);
      console.log(`🌐 Frontend App: http://localhost:${env.port}`);
      console.log(`📁 Thư mục lưu tệp: ${env.uploadDir}`);
      console.log('==================================================');
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\nNhận tín hiệu ${signal}. Đang đóng server an toàn...`);
      server.close(async () => {
        if (prisma) {
          await prisma.$disconnect();
        }
        console.log('Đã đóng kết nối cơ sở dữ liệu và dừng server.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('Lỗi khởi động server:', err);
    process.exit(1);
  }
}

startServer();
