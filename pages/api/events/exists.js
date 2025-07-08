import prisma from "db"; // Import prisma

// --> /api/events/exists
export default async (req, res) => {
  // Collect voter ID from request object
  const {
    query: { id },
  } = req;

  try {
    // Search UnifiedVoters table for individual voters
    const voter = await prisma.unifiedVoters.findFirst({
      where: {
        // For entry with matching user_id and individual auth_type
        user_id: id,
        auth_type: "individual",
      },
    });

    if (voter) {
      // If voter is present, return 200 status
      res.status(200).send("Found voter");
    } else {
      // Else, return 502
      res.status(502).send("Unable to find voter");
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Exists API Error:", error);
    }
    res.status(500).send("Unable to find voter");
  }
};
