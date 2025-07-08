import prisma from "db"; // Import prisma
import moment from "moment"; // Time formatting
import crypto from "crypto"; // For generating unique IDs

// --> /api/events/create
export default async (req, res) => {
  try {
    // Collect event details from request body
    const event = req.body;
    
    // Validate required fields
    if (!event.event_title || !event.start_event_date || !event.end_event_date) {
      return res.status(400).json({ error: "必須フィールドが不足しています" });
    }
    
    // Validate date range
    const startDate = formatAsPGTimestamp(event.start_event_date);
    const endDate = formatAsPGTimestamp(event.end_event_date);
    
    if (startDate >= endDate) {
      return res.status(400).json({ error: "開始日は終了日より前である必要があります" });
    }
    
    const vote_data = [];

    // Loop through all subjects
    for (const subject of event.subjects) {
      // Assign 0 votes to each subject
      vote_data.push({
        ...subject,
        votes: 0,
      });
    }

    // Create voters data for individual mode only
    const voters = [];
    const voter_ids = []; // 投票者IDを収集する配列
    if (event.voting_mode === "individual") {
      // Fill array with voter data based on num_voters in request body
      for (let i = 0; i < event.num_voters; i++) {
        const voterId = crypto.randomUUID(); // ユニークで予測不可能なID
        voter_ids.push(voterId); // 投票者IDを配列に追加
        voters.push({
          auth_type: "individual",
          user_id: voterId,
          email: null, // 個別投票では不要
          name: null, // 個別投票では不要
          vote_data: vote_data, // Placeholder zeroed vote_data
        });
      }
    }

    // Create new event
    const createdEvent = await prisma.events.create({
      data: {
        event_title: event.event_title,
        event_description: event.event_description,
        num_voters: event.num_voters,
        credits_per_voter: event.credits_per_voter,
        start_event_date: startDate,
        end_event_date: endDate,
        // Stringify voteable subject data
        event_data: JSON.stringify({
          options: event.subjects,
          credits_per_voter: event.credits_per_voter,
          voter_ids: voter_ids // 個別投票用の投票者ID配列を追加
        }),
        voting_mode: event.voting_mode || "individual", // デフォルトは個別投票
        // Create voters from filled array (only for individual mode)
        UnifiedVoters: voters.length > 0 ? { create: voters } : undefined,
      },
      select: {
        id: true,
        secret_key: true,
      },
    });

    // Send back created event
    res.status(201).json(createdEvent);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("イベント作成エラー:", error);
    }
    res.status(500).json({ error: "イベント作成に失敗しました" });
  }
};

/**
 * Converts date to Postgres-compatible DATETIME
 * @param {string|Date|moment} date Date input (string, Date object, or moment object)
 * @returns {Date} Date object compatible with Postgres
 */
function formatAsPGTimestamp(date) {
  if (!date) {
    throw new Error("日付が指定されていません");
  }
  
  // If it's already a Date object, return it
  if (date instanceof Date) {
    return date;
  }
  
  // If it's a moment object, convert to Date
  if (date && typeof date === 'object' && date._isAMomentObject) {
    return date.toDate();
  }
  
  // If it's a string, parse it with moment
  if (typeof date === 'string') {
    const parsedDate = moment(date);
    if (!parsedDate.isValid()) {
      throw new Error("無効な日付形式です");
    }
    return parsedDate.toDate();
  }
  
  // For any other case, try to parse with moment
  const parsedDate = moment(date);
  if (!parsedDate.isValid()) {
    throw new Error("無効な日付形式です");
  }
  return parsedDate.toDate();
}
