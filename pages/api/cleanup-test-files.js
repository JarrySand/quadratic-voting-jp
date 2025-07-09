// テストファイルを削除するためのクリーンアップAPI
export default async function handler(req, res) {
  // このAPIは管理者のみが使用可能
  if (req.query.token !== 'cleanup-2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // このAPIは実際にはファイルを削除しません
    // 後でgitから削除する際の参考用
    const testFiles = [
      'pages/api/test-db.js',
      'pages/api/test-prisma.js',
      'pages/api/cleanup-test-files.js'
    ];
    
    res.status(200).json({
      message: 'Test files to be removed after debugging',
      files: testFiles,
      command: 'git rm ' + testFiles.join(' '),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 