-- Add the reveal fields to the Comment model
ALTER TABLE "comments" ADD COLUMN "revealRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comments" ADD COLUMN "revealApproved" BOOLEAN NOT NULL DEFAULT false; 