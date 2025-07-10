import { PrismaClient } from "@prisma/client"; // Import prisma client

// 接続プール設定の最適化
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined');
  }
  
  // Transaction Pooler用の接続パラメータ
  const connectionParams = [
    'pgbouncer=true',             // PgBouncerモード有効化（Transaction Pooler）
    'connect_timeout=60',         // 接続タイムアウト（秒）
    'socket_timeout=45',          // ソケットタイムアウト（秒）
    'pool_timeout=20'             // プールタイムアウト（秒）
  ];
  
  const separator = url.includes('?') ? '&' : '?';
  const optimizedUrl = `${url}${separator}${connectionParams.join('&')}`;
  

  
  return optimizedUrl;
};

// Prismaクライアントのインスタンスを作成（接続プール最適化）
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
      url: getDatabaseUrl(),
    },
  },
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



// 接続プールの適切なクローズ処理
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ [PRISMA] Error during disconnect:', error);
  }
  process.exit(0);
};

// プロセス終了時のクリーンアップ
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

// 未処理の例外とrejectionのハンドリング
process.on('uncaughtException', (error) => {
  console.error('❌ [PRISMA] Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [PRISMA] Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// 接続プールの健全性確認用の定期チェック
let connectionHealthInterval;

if (process.env.NODE_ENV === 'production') {
  connectionHealthInterval = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error('❌ [PRISMA] Connection health check failed:', error);
      // 必要に応じて再接続処理
    }
  }, 300000); // 5分間隔

  // インターバルクリーンアップ
  process.on('beforeExit', () => {
    if (connectionHealthInterval) {
      clearInterval(connectionHealthInterval);
    }
  });
}

// Export prisma client
export default prisma;
