import prisma from "db"
import { getAuthContext } from "lib/auth"
import { getToken } from "next-auth/jwt"
import { 
  getEventWithValidation, 
  parseEventData, 
  validateVotingPeriod, 
  validateVotingMode,
  validateVoteData,
  validateVoteCredits,
  buildVoteData
} from "lib/helpers"

// --> /api/debug/vote-test
export default async (req, res) => {
  try {
    let debugSteps = {};
    
    // Step 1: 基本環境チェック
    debugSteps.step1_environment = {
      status: "running",
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
      method: req.method,
      timestamp: new Date().toISOString()
    };
    
    // Step 2: 利用可能なイベント取得
    debugSteps.step2_available_events = {
      status: "running"
    };
    
    try {
      const events = await prisma.events.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          event_title: true,
          voting_mode: true,
          created_at: true,
          end_event_date: true
        }
      });
      
      debugSteps.step2_available_events = {
        status: "success",
        events: events,
        event_count: events.length
      };
    } catch (error) {
      debugSteps.step2_available_events = {
        status: "error",
        error: error.message
      };
    }
    
         // Step 3: 個別投票用のイベント詳細取得テスト
     debugSteps.step3_event_details = {
       status: "running"
     };
     
     try {
       const latestEvent = await prisma.events.findFirst({
         orderBy: { created_at: 'desc' },
         where: {
           voting_mode: 'individual'
         }
       });
       
       if (latestEvent) {
         // イベント詳細情報の取得
         const eventDetails = await prisma.events.findUnique({
           where: { id: latestEvent.id }
         });
         
         // 個別投票では、event_dataから投票者IDを取得
         let voterIds = [];
         let sampleVoterId = null;
         
         if (eventDetails.event_data) {
           const eventData = typeof eventDetails.event_data === 'string' 
             ? JSON.parse(eventDetails.event_data) 
             : eventDetails.event_data;
           
           voterIds = eventData.voter_ids || [];
           sampleVoterId = voterIds[0] || null;
         }
         
         debugSteps.step3_event_details = {
           status: "success",
           event_id: latestEvent.id,
           event_title: latestEvent.event_title,
           voting_mode: latestEvent.voting_mode,
           voter_ids_count: voterIds.length,
           sample_voter_id: sampleVoterId,
           voter_ids_sample: voterIds.slice(0, 3) // 最初の3つを表示
         };
       } else {
         debugSteps.step3_event_details = {
           status: "error",
           error: "個別投票用イベントが見つかりません"
         };
       }
     } catch (error) {
       debugSteps.step3_event_details = {
         status: "error",
         error: error.message
       };
     }
    
    // Step 4: 個別投票API模擬テスト
    debugSteps.step4_individual_vote_simulation = {
      status: "running"
    };
    
    try {
      if (debugSteps.step3_event_details.status === "success" && debugSteps.step3_event_details.sample_voter_id) {
        const voterId = debugSteps.step3_event_details.sample_voter_id;
        const eventId = debugSteps.step3_event_details.event_id;
        
        // 模擬リクエストオブジェクト
        const mockReq = {
          method: 'POST',
          body: {
            id: voterId,
            event_id: eventId,
            votes: [1, 1, 0],
            name: 'テストユーザー'
          }
        };
        
        // 認証コンテキスト取得テスト
        let authContextResult = null;
        try {
          const authContext = await getAuthContext(mockReq);
          authContextResult = {
            success: true,
            auth_type: authContext.type,
            user_id: authContext.userId,
            unified_user_id: authContext.getUnifiedUserId()
          };
        } catch (authError) {
          authContextResult = {
            success: false,
            error: authError.message
          };
        }
        
        // イベント検証テスト
        let eventValidationResult = null;
        try {
          const event = await getEventWithValidation(eventId);
          const eventData = parseEventData(event);
          
          eventValidationResult = {
            success: true,
            event_title: event.event_title,
            voting_mode: event.voting_mode,
            options_count: eventData.options.length
          };
        } catch (validationError) {
          eventValidationResult = {
            success: false,
            error: validationError.message
          };
        }
        
        debugSteps.step4_individual_vote_simulation = {
          status: "success",
          voter_id: voterId,
          event_id: eventId,
          auth_context_result: authContextResult,
          event_validation_result: eventValidationResult
        };
      } else {
        debugSteps.step4_individual_vote_simulation = {
          status: "error",
          error: "利用可能な投票者IDがありません"
        };
      }
    } catch (error) {
      debugSteps.step4_individual_vote_simulation = {
        status: "error",
        error: error.message
      };
    }
    
    // Step 5: ソーシャル認証テスト
    debugSteps.step5_social_auth_test = {
      status: "running"
    };
    
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      
      debugSteps.step5_social_auth_test = {
        status: "success",
        token_exists: !!token,
        token_data: token ? {
          provider: token.provider,
          email: token.email,
          name: token.name
        } : null
      };
    } catch (error) {
      debugSteps.step5_social_auth_test = {
        status: "error",
        error: error.message
      };
    }
    
    // 最終結果の判定
    const allStepsSuccess = Object.values(debugSteps).every(step => step.status === "success");
    
    res.status(200).json({
      success: allStepsSuccess,
      message: allStepsSuccess ? "全ステップ成功" : "一部のステップでエラー",
      debug_steps: debugSteps,
      timestamp: new Date().toISOString(),
      recommendations: {
        individual_voting: debugSteps.step4_individual_vote_simulation.status === "success" 
          ? "個別投票は正常に動作する可能性があります" 
          : "個別投票でエラーが発生しています",
        social_voting: debugSteps.step5_social_auth_test.status === "success" 
          ? "ソーシャル認証は利用可能です" 
          : "ソーシャル認証でエラーが発生しています"
      }
    });

  } catch (error) {
    console.error("Vote Test Debug API Error:", error);
    res.status(500).json({
      success: false,
      message: "投票テストデバッグAPIでエラーが発生しました",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 