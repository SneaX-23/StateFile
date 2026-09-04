-- name: GetAccessToken :one
SELECT "accessToken", "providerId" FROM account WHERE "userId" = $1;

-- name: CheckRepoLimit :one
SELECT "allowedRepos" from user_profiles WHERE "userId" = $1;


-- name: DecrementRepoLimit :one
UPDATE user_profiles
SET "allowedRepos" = "allowedRepos" - $1
WHERE "userId" = $2 AND "allowedRepos" >= $1
RETURNING "allowedRepos";

-- name: AddRepos :copyfrom
INSERT INTO repositories (
    "userId",
    "githubRepoId",
    "repoName"
) VALUES ($1, $2, $3);

