import { PrismaClient } from "@prisma/client"; // Import prisma client

// Prismaクライアントのインスタンスを作成（詳細ログ有効化）
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// ログイベントリスナーの設定
prisma.$on('query', (e) => {
  console.log('🔍 [PRISMA] Query:', {
    query: e.query,
    params: e.params,
    duration: e.duration,
    timestamp: e.timestamp,
  });
});

prisma.$on('error', (e) => {
  console.error('❌ [PRISMA] Error:', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp,
  });
});

prisma.$on('info', (e) => {
  console.log('ℹ️ [PRISMA] Info:', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp,
  });
});

prisma.$on('warn', (e) => {
  console.warn('⚠️ [PRISMA] Warning:', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp,
  });
});

// 接続テスト用のログ
console.log('🔍 [PRISMA] Client initialized:', {
  database_url_exists: !!process.env.DATABASE_URL,
  database_url_preview: process.env.DATABASE_URL?.substring(0, 50) + '...',
  node_env: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
});

// Export prisma client
export default prisma;
