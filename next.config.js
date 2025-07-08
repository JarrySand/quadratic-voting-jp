/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 Phase 3: パフォーマンス最適化設定
  
  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // バンドル最適化
  compiler: {
    // 本番環境でのconsole.log削除
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 圧縮最適化
  compress: true,
  
  // 実験的機能 - パフォーマンス向上
  experimental: {
    // メモリ使用量最適化
    workerThreads: false,
  },
  
  // Webpack設定カスタマイズ
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 本番環境でのバンドル最適化
    if (!dev && !isServer) {
      // Tree shakingの強化
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    
    return config;
  },
  
  // 日本語対応
  i18n: {
    locales: ['ja'],
    defaultLocale: 'ja',
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 