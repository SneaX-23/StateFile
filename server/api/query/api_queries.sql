-- name: GetAccessToken :one
SELECT "accessToken", "providerId" FROM account WHERE "userId" = $1;

-- name: CheckRepoLimit :one
SELECT "allowedRepos" from user_profiles WHERE "userId" = $1;

