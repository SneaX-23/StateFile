-- name: GetAccessToken :one
SELECT "accessToken", "providerId" FROM account WHERE "userId" = $1;
