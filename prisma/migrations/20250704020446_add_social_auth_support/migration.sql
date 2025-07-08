-- CreateTable
CREATE TABLE "Events" (
    "id" TEXT NOT NULL,
    "secret_key" TEXT,
    "event_title" TEXT,
    "event_description" TEXT,
    "num_voters" INTEGER NOT NULL DEFAULT 10,
    "credits_per_voter" INTEGER NOT NULL DEFAULT 5,
    "start_event_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_event_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_data" JSONB,
    "voting_mode" TEXT NOT NULL DEFAULT 'individual',

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voters" (
    "id" TEXT NOT NULL,
    "event_uuid" TEXT NOT NULL,
    "voter_name" TEXT,
    "vote_data" JSONB,

    CONSTRAINT "Voters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleVoters" (
    "id" TEXT NOT NULL,
    "event_uuid" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "provider_id" TEXT NOT NULL,
    "google_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "vote_data" JSONB,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleVoters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleVoters_event_uuid_provider_provider_id_key" ON "GoogleVoters"("event_uuid", "provider", "provider_id");

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_event_uuid_fkey" FOREIGN KEY ("event_uuid") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleVoters" ADD CONSTRAINT "GoogleVoters_event_uuid_fkey" FOREIGN KEY ("event_uuid") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
