import useSWR, { mutate } from 'swr';

// 認証が必要なAPIのパターンを定義
const AUTH_REQUIRED_PATTERNS = [
  '/api/events/find?event_id=',  // SNS認証投票用
  '/api/events/vote',            // SNS認証投票用
  '/api/auth/',                  // 認証API
];

// URLが認証を必要とするかチェック
const requiresAuth = (url) => {
  return AUTH_REQUIRED_PATTERNS.some(pattern => url.includes(pattern));
};

// 改良されたフェッチャー関数（認証必要APIのみCredentials送信）
const fetcher = async (url) => {
  const fetchOptions = {
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  const isAuthRequired = requiresAuth(url);
  
  // 認証が必要なAPIの場合のみCredentials送信
  if (isAuthRequired) {
    fetchOptions.credentials = 'include';
  }
  
  // デバッグ情報を出力（環境変数チェック削除）
  console.log("🔍 [DEBUG] SWR Fetcher 実行:", {
    url: url,
    auth_required: isAuthRequired,
    credentials_included: !!fetchOptions.credentials,
    fetch_options: fetchOptions,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
  
  try {
    const res = await fetch(url, fetchOptions);
    
    // レスポンスデバッグ（環境変数チェック削除）
    console.log("🔍 [DEBUG] SWR Response:", {
      url: url,
      status: res.status,
      ok: res.ok,
      headers: {
        'content-type': res.headers.get('content-type'),
        'set-cookie': res.headers.get('set-cookie'),
      },
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    if (!res.ok) {
      // エラーレスポンスの詳細をログ出力（環境変数チェック削除）
      console.error("🔍 [DEBUG] SWR Error Response:", {
        url: url,
        status: res.status,
        statusText: res.statusText,
        auth_required: isAuthRequired,
        credentials_sent: !!fetchOptions.credentials,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // 成功レスポンスのデバッグ（環境変数チェック削除）
    console.log("🔍 [DEBUG] SWR Success Response:", {
      url: url,
      data_keys: Object.keys(data),
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    return data;
    
  } catch (error) {
    // fetch エラーのデバッグ（環境変数チェック削除）
    console.error("🔍 [DEBUG] SWR Fetch Error:", {
      url: url,
      error_message: error.message,
      auth_required: isAuthRequired,
      credentials_sent: !!fetchOptions.credentials,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};

// キャッシュ戦略設定
const CACHE_STRATEGIES = {
  // 投票結果：リアルタイム更新（500ms間隔）
  REALTIME: {
    refreshInterval: 500,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    dedupingInterval: 100, // 100ms以内の重複リクエスト防止
  },
  
  // 実証実験用リアルタイム更新（負荷軽減版）
  EXPERIMENT_REALTIME: {
    refreshInterval: 2000, // 2秒（500ms→2sに変更）
    revalidateOnFocus: false, // 実験中の不要な再読み込み防止
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    dedupingInterval: 1000, // 1秒（100ms→1sに変更）
  },
  
  // イベント基本情報：長期キャッシュ（10分）
  LONG_TERM: {
    refreshInterval: 600000, // 10分
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 10000,
    dedupingInterval: 2000,
  },
  
  // 投票者データ：中期キャッシュ（5分）
  MEDIUM_TERM: {
    refreshInterval: 300000, // 5分
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    dedupingInterval: 1000,
  },
  
  // 一回限り取得（更新なし）
  STATIC: {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    dedupingInterval: 5000,
  }
};

// 投票システム用のリアルタイム更新フック
export const useVoteData = (url, options = {}) => {
  const { data, error, mutate: mutateFn } = useSWR(url, fetcher, {
    ...CACHE_STRATEGIES.REALTIME,
    ...options
  });

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate: mutateFn
  };
};

// 実証実験用投票データフック（負荷軽減版）
export const useExperimentVoteData = (url, options = {}) => {
  const { data, error, mutate: mutateFn } = useSWR(url, fetcher, {
    ...CACHE_STRATEGIES.EXPERIMENT_REALTIME,
    ...options
  });

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate: mutateFn
  };
};

// イベント基本情報用フック（長期キャッシュ）
export const useEventData = (url, options = {}) => {
  const { data, error, mutate: mutateFn } = useSWR(url, fetcher, {
    ...CACHE_STRATEGIES.LONG_TERM,
    ...options
  });

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate: mutateFn
  };
};

// 投票者データ用フック（中期キャッシュ）
export const useVoterData = (url, options = {}) => {
  const { data, error, mutate: mutateFn } = useSWR(url, fetcher, {
    ...CACHE_STRATEGIES.MEDIUM_TERM,
    ...options
  });

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate: mutateFn
  };
};

// 通常のデータ取得用（リアルタイム更新なし）
export const useApiData = (url, options = {}) => {
  const { data, error, mutate: mutateFn } = useSWR(url, fetcher, {
    ...CACHE_STRATEGIES.STATIC,
    ...options
  });

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate: mutateFn
  };
};

// POST/PUT/DELETE用のAPI通信フック
export const useApi = () => {
  const apiCall = async (url, options = {}) => {
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };

    // 認証が必要なAPIの場合のみCredentials送信
    if (requiresAuth(url)) {
      fetchOptions.credentials = 'include';
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  };

  return {
    post: (url, data) => apiCall(url, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    put: (url, data) => apiCall(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (url) => apiCall(url, {
      method: 'DELETE'
    })
  };
};

// キャッシュ管理ユーティリティ
export const cacheUtils = {
  // 特定のキーのキャッシュを無効化
  invalidateCache: (key) => {
    return mutate(key);
  },
  
  // パターンに一致するキャッシュをすべて無効化
  invalidateCachePattern: (pattern) => {
    return mutate(
      key => typeof key === 'string' && key.includes(pattern),
      undefined,
      { revalidate: true }
    );
  },
  
  // イベント関連のキャッシュをすべて無効化
  invalidateEventCache: (eventId) => {
    const patterns = [
      `/api/events/details?id=${eventId}`,
      `/api/events/stats?event_id=${eventId}`,
      `/api/events/find?event_id=${eventId}`
    ];
    
    return Promise.all(patterns.map(pattern => mutate(pattern)));
  }
};

// 投票専用フック（投票後の自動更新対応）
export const useVoting = (eventId) => {
  const { post } = useApi();

  const submitVote = async (voteData) => {
    try {
      const response = await post('/api/events/vote', voteData);
      
      // 投票成功後、関連するSWRキャッシュを更新
      if (eventId) {
        await cacheUtils.invalidateEventCache(eventId);
      }
      
      return response;
    } catch (error) {
      throw new Error(`投票に失敗しました: ${error.message}`);
    }
  };

  return { submitVote };
};

// イベント作成専用フック
export const useEventCreation = () => {
  const { post } = useApi();

  const createEvent = async (eventData) => {
    try {
      const response = await post('/api/events/create', eventData);
      
      // イベント作成後、関連キャッシュを予め無効化
      if (response.id) {
        await cacheUtils.invalidateEventCache(response.id);
      }
      
      return response;
    } catch (error) {
      throw new Error(`イベント作成に失敗しました: ${error.message}`);
    }
  };

  return { createEvent };
};

// イベント更新専用フック
export const useEventUpdate = () => {
  const { post } = useApi();

  const updateEvent = async (eventData) => {
    try {
      const response = await post('/api/events/update', eventData);
      
      // イベント更新後、関連キャッシュを無効化
      if (eventData.id) {
        await cacheUtils.invalidateEventCache(eventData.id);
      }
      
      return response;
    } catch (error) {
      throw new Error(`イベント更新に失敗しました: ${error.message}`);
    }
  };

  return { updateEvent };
}; 