import prisma from "db"

// --> /api/events/stats (統一統計API)
export default async (req, res) => {
  try {
    const { event_id, secret_key } = req.query

    if (!event_id) {
      return res.status(400).json({ error: "イベントIDが必要です" })
    }

    // イベント情報を取得
    const event = await prisma.events.findUnique({
      where: { id: event_id },
      select: {
        id: true,
        event_title: true,
        event_description: true,
        start_event_date: true,
        end_event_date: true,
        credits_per_voter: true,
        event_data: true,
        voting_mode: true,
        secret_key: true,
      },
    })

    if (!event) {
      return res.status(404).json({ error: "イベントが見つかりません" })
    }

    // ソーシャル認証イベントかチェック（google_auth も含む）
    if (event.voting_mode !== "social_auth" && event.voting_mode !== "google_auth") {
      return res.status(400).json({ error: "このイベントはソーシャル認証投票に対応していません" })
    }

    // 管理者権限チェック（secret_keyが提供された場合）
    const isAdmin = secret_key && secret_key === event.secret_key

    // UnifiedVotersテーブルから投票者データを取得
    const voters = await prisma.unifiedVoters.findMany({
      where: { 
        event_id: event_id,
        auth_type: {
          in: ['google', 'line'] // ソーシャル認証のみ
        }
      },
      select: {
        id: true,
        auth_type: true,
        user_id: true,
        email: isAdmin ? true : false, // 管理者のみメールアドレスを取得
        name: true,
        vote_data: true,
        voted_at: true,
      },
      orderBy: { voted_at: 'desc' },
    })

    // event_dataがJSON文字列の場合はパース
    let eventData
    try {
      eventData = typeof event.event_data === 'string' 
        ? JSON.parse(event.event_data) 
        : event.event_data
    } catch (parseError) {
      return res.status(500).json({ error: "イベントデータの解析に失敗しました" })
    }

    // 投票結果を集計
    let aggregatedResults = []
    
    if (eventData?.options) {
      aggregatedResults = eventData.options.map((option, index) => {
        const totalVotes = voters.reduce((sum, voter) => {
          const voterVotes = voter.vote_data?.[index]?.votes || 0
          return sum + voterVotes
        }, 0)

        const totalCost = voters.reduce((sum, voter) => {
          const voterVotes = voter.vote_data?.[index]?.votes || 0
          return sum + (voterVotes * voterVotes)
        }, 0)

        return {
          title: option.title,
          description: option.description || "",
          url: option.url || "",
          total_votes: totalVotes,
          total_cost: totalCost,
          voter_count: voters.filter(voter => 
            (voter.vote_data?.[index]?.votes || 0) > 0
          ).length,
        }
      })
    }

    // プロバイダー別統計（auth_typeに基づく）
    const providerStats = voters.reduce((stats, voter) => {
      const provider = voter.auth_type || 'unknown'
      stats[provider] = (stats[provider] || 0) + 1
      return stats
    }, {})

    // レスポンスデータ
    const response = {
      event: {
        id: event.id,
        event_title: event.event_title,
        event_description: event.event_description,
        start_event_date: event.start_event_date,
        end_event_date: event.end_event_date,
        credits_per_voter: event.credits_per_voter,
        voting_mode: event.voting_mode,
      },
      stats: {
        total_voters: voters.length,
        total_votes: aggregatedResults.reduce((sum, result) => sum + result.total_votes, 0),
        total_cost: aggregatedResults.reduce((sum, result) => sum + result.total_cost, 0),
        provider_breakdown: providerStats,
      },
      results: aggregatedResults,
      voters: isAdmin ? voters : voters.map(voter => ({
        id: voter.id,
        name: voter.name,
        provider: voter.auth_type, // auth_typeをproviderとして返す
        voted_at: voter.voted_at,
        // 投票データは含めない（プライバシー保護）
      })),
      is_admin: isAdmin,
    }

    res.json(response)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Stats API error:", error)
    }
    res.status(500).json({ error: "サーバーエラーが発生しました" })
  }
} 