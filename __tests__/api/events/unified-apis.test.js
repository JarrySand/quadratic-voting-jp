/**
 * @jest-environment node
 */

// 一部のテストで実際のライブラリを使用する設定
const actualAuth = jest.requireActual('lib/auth')
const actualHelpers = jest.requireActual('lib/helpers')

// モックの設定
jest.mock('db', () => ({
  __esModule: true,
  default: {
    events: {
      findUnique: jest.fn(),
    },
    unifiedVoters: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}))

// 統一認証コンテキストのテストでは実際のauth.jsを使用
describe('統一認証コンテキスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('個別投票の認証コンテキスト', async () => {
    const mockRequest = {
      body: { id: 'voter123', name: 'テストユーザー' },
      query: {}
    }
    
    const authContext = await actualAuth.getAuthContext(mockRequest)
    
    expect(authContext.type).toBe(actualAuth.AuthType.INDIVIDUAL)
    expect(authContext.userId).toBe('voter123')
    expect(authContext.name).toBe('テストユーザー')
    expect(authContext.isIndividual()).toBe(true)
    expect(authContext.isSocial()).toBe(false)
    expect(authContext.getUnifiedUserId()).toBe('voter123')
  })

  test('Google認証のコンテキスト', async () => {
    const { getToken } = require('next-auth/jwt')
    
    const mockRequest = {
      body: {},
      query: {}
    }
    
    // Google認証のトークンをモック
    getToken.mockResolvedValue({
      provider: 'google',
      googleId: 'google123',
      email: 'test@example.com',
      name: 'Googleユーザー'
    })
    
    const authContext = await actualAuth.getAuthContext(mockRequest)
    
    expect(authContext.type).toBe(actualAuth.AuthType.GOOGLE)
    expect(authContext.userId).toBe('google123')
    expect(authContext.email).toBe('test@example.com')
    expect(authContext.name).toBe('Googleユーザー')
    expect(authContext.isIndividual()).toBe(false)
    expect(authContext.isSocial()).toBe(true)
    expect(authContext.getUnifiedUserId()).toBe('google:google123')
  })

  test('LINE認証のコンテキスト', async () => {
    const { getToken } = require('next-auth/jwt')
    
    const mockRequest = {
      body: {},
      query: {}
    }
    
    // LINE認証のトークンをモック
    getToken.mockResolvedValue({
      provider: 'line',
      lineId: 'line123',
      email: 'line@example.com',
      name: 'LINEユーザー'
    })
    
    const authContext = await actualAuth.getAuthContext(mockRequest)
    
    expect(authContext.type).toBe(actualAuth.AuthType.LINE)
    expect(authContext.userId).toBe('line123')
    expect(authContext.email).toBe('line@example.com')
    expect(authContext.name).toBe('LINEユーザー')
    expect(authContext.isIndividual()).toBe(false)
    expect(authContext.isSocial()).toBe(true)
    expect(authContext.getUnifiedUserId()).toBe('line:line123')
  })
})

// ヘルパー関数のテストでは実際のhelpers.jsを使用
describe('ヘルパー関数', () => {
  test('投票データの検証 - 正常ケース', () => {
    const validVotes = [1, 2, 0]
    const eventData = {
      options: [
        { title: '選択肢1' },
        { title: '選択肢2' },
        { title: '選択肢3' }
      ]
    }
    
    expect(() => actualHelpers.validateVoteData(validVotes, eventData)).not.toThrow()
  })
  
  test('投票データの検証 - 配列以外でエラー', () => {
    const invalidVotes = "not-an-array"
    const eventData = {
      options: [
        { title: '選択肢1' },
        { title: '選択肢2' },
        { title: '選択肢3' }
      ]
    }
    
    expect(() => actualHelpers.validateVoteData(invalidVotes, eventData)).toThrow('投票データは配列である必要があります')
  })
  
  test('投票データの検証 - 項目数不一致でエラー', () => {
    const invalidVotes = [1, 2] // 2項目のみ
    const eventData = {
      options: [
        { title: '選択肢1' },
        { title: '選択肢2' },
        { title: '選択肢3' } // 3項目
      ]
    }
    
    expect(() => actualHelpers.validateVoteData(invalidVotes, eventData)).toThrow('投票データの項目数が一致しません')
  })
  
  test('投票ポイントの計算 - 正常ケース', () => {
    const votes = [1, 2, 0] // 1² + 2² + 0² = 5
    const eventData = { credits_per_voter: 10 }
    const event = { credits_per_voter: 5 }
    
    const result = actualHelpers.validateVoteCredits(votes, eventData, event)
    
    expect(result.totalCost).toBe(5)
    expect(result.maxCredits).toBe(10)
    expect(result.remainingCredits).toBe(5)
  })
  
  test('投票ポイント上限超過エラー', () => {
    const votes = [3, 3, 3] // 3² + 3² + 3² = 27
    const eventData = { credits_per_voter: 10 }
    const event = { credits_per_voter: 5 }
    
    expect(() => actualHelpers.validateVoteCredits(votes, eventData, event)).toThrow('投票ポイントが上限を超えています')
  })

  test('投票期間の検証 - 正常ケース', () => {
    const event = {
      start_event_date: new Date(Date.now() - 86400000), // 1日前
      end_event_date: new Date(Date.now() + 86400000)    // 1日後
    }
    
    expect(() => actualHelpers.validateVotingPeriod(event)).not.toThrow()
  })
  
  test('投票期間の検証 - 期間前エラー', () => {
    const event = {
      start_event_date: new Date(Date.now() + 86400000), // 1日後
      end_event_date: new Date(Date.now() + 172800000)   // 2日後
    }
    
    expect(() => actualHelpers.validateVotingPeriod(event)).toThrow('投票期間が開始されていません')
  })

  test('投票データの構築', () => {
    const votes = [1, 2, 0]
    const eventData = {
      options: [
        { title: '選択肢1', description: '説明1' },
        { title: '選択肢2', description: '説明2' },
        { title: '選択肢3', description: '説明3' }
      ]
    }
    
    const result = actualHelpers.buildVoteData(votes, eventData)
    
    expect(result).toEqual([
      { title: '選択肢1', description: '説明1', url: '', votes: 1 },
      { title: '選択肢2', description: '説明2', url: '', votes: 2 },
      { title: '選択肢3', description: '説明3', url: '', votes: 0 }
    ])
  })
})

// 残りのテストはモックを使用
jest.mock('lib/auth', () => ({
  getAuthContext: jest.fn(),
  getVoterData: jest.fn(),
  upsertVoterData: jest.fn(),
  checkDuplicateVoteByEmail: jest.fn(),
  AuthType: {
    INDIVIDUAL: 'individual',
    GOOGLE: 'google',
    LINE: 'line'
  },
  AuthContext: class MockAuthContext {
    constructor(type, userId, email = null, name = null) {
      this.type = type
      this.userId = userId
      this.email = email
      this.name = name
    }
    
    getUnifiedUserId() {
      return this.type === 'individual' ? this.userId : `${this.type}:${this.userId}`
    }
    
    isIndividual() {
      return this.type === 'individual'
    }
    
    isSocial() {
      return this.type === 'google' || this.type === 'line'
    }
  }
}))

jest.mock('lib/helpers', () => ({
  getEventWithValidation: jest.fn(),
  parseEventData: jest.fn(),
  validateVotingPeriod: jest.fn(),
  validateVotingMode: jest.fn(),
  validateVoteData: jest.fn(),
  validateVoteCredits: jest.fn(),
  buildVoteData: jest.fn(),
  buildFindResponse: jest.fn(),
  sendErrorResponse: jest.fn(),
  sendSuccessResponse: jest.fn(),
}))

// 統一投票APIのテスト
describe('統一投票API (/api/events/vote)', () => {
  let mockRequest, mockResponse
  
  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      body: {},
      query: {},
    }
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    }
    
    jest.clearAllMocks()
  })

  test('個別投票 - 正常ケース', async () => {
    const { getAuthContext, getVoterData, upsertVoterData, checkDuplicateVoteByEmail, AuthType, AuthContext } = require('lib/auth')
    const { 
      getEventWithValidation, 
      parseEventData, 
      validateVotingPeriod, 
      validateVotingMode,
      validateVoteData,
      validateVoteCredits,
      buildVoteData,
      sendSuccessResponse
    } = require('lib/helpers')
    
    // 個別投票者の設定
    mockRequest.body = {
      id: 'voter123',
      event_id: 'event123',
      votes: [1, 2, 0],
      name: 'テストユーザー'
    }
    
    // モックレスポンスの設定
    const mockAuthContext = new AuthContext(AuthType.INDIVIDUAL, 'voter123', null, 'テストユーザー')
    
    getAuthContext.mockResolvedValue(mockAuthContext)
    getEventWithValidation.mockResolvedValue({
      id: 'event123',
      event_title: 'テストイベント',
      voting_mode: 'individual',
      credits_per_voter: 10,
      start_event_date: new Date('2024-01-01'),
      end_event_date: new Date('2024-12-31'),
      event_data: JSON.stringify({
        options: [
          { title: '選択肢1' },
          { title: '選択肢2' },
          { title: '選択肢3' }
        ],
        credits_per_voter: 10
      })
    })
    parseEventData.mockReturnValue({
      options: [
        { title: '選択肢1' },
        { title: '選択肢2' },
        { title: '選択肢3' }
      ],
      credits_per_voter: 10
    })
    validateVotingPeriod.mockReturnValue(true)
    validateVotingMode.mockReturnValue(true)
    validateVoteData.mockReturnValue(true)
    validateVoteCredits.mockReturnValue({ totalCost: 5, maxCredits: 10, remainingCredits: 5 })
    buildVoteData.mockReturnValue([
      { title: '選択肢1', votes: 1 },
      { title: '選択肢2', votes: 2 },
      { title: '選択肢3', votes: 0 }
    ])
    checkDuplicateVoteByEmail.mockResolvedValue(null)
    getVoterData.mockResolvedValue(null)
    upsertVoterData.mockResolvedValue({ id: 'unified123' })
    
    sendSuccessResponse.mockImplementation((res, data, message) => {
      res.status(200).json({ message, ...data })
    })
    
    // テスト実行
    const voteHandler = require('../../../pages/api/events/vote').default
    await voteHandler(mockRequest, mockResponse)
    
    // 結果の検証
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      mockResponse,
      expect.objectContaining({
        action: 'created',
        voter_id: 'voter123'
      }),
      '投票を受け付けました'
    )
  })

  test('POST以外のメソッド - エラー', async () => {
    mockRequest.method = 'GET'
    
    const { sendErrorResponse } = require('lib/helpers')
    sendErrorResponse.mockImplementation((res, status, message) => {
      res.status(status).json({ error: message })
    })
    
    const voteHandler = require('../../../pages/api/events/vote').default
    await voteHandler(mockRequest, mockResponse)
    
    expect(sendErrorResponse).toHaveBeenCalledWith(
      mockResponse,
      405,
      'POSTメソッドのみ許可されています'
    )
  })

  test('必要データ不足 - エラー', async () => {
    mockRequest.body = {
      id: 'voter123',
      // event_id と votes が不足
    }
    
    const { getAuthContext, AuthType, AuthContext } = require('lib/auth')
    const { sendErrorResponse } = require('lib/helpers')
    
    const mockAuthContext = new AuthContext(AuthType.INDIVIDUAL, 'voter123', null, 'テストユーザー')
    getAuthContext.mockResolvedValue(mockAuthContext)
    
    sendErrorResponse.mockImplementation((res, status, message) => {
      res.status(status).json({ error: message })
    })
    
    const voteHandler = require('../../../pages/api/events/vote').default
    await voteHandler(mockRequest, mockResponse)
    
    expect(sendErrorResponse).toHaveBeenCalledWith(
      mockResponse,
      400,
      '必要なデータが不足しています'
    )
  })
}) 