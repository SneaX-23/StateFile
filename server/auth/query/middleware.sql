-- name: GetInfoFromSession :one
SELECT "userId", "expiresAt" FROM session WHERE token = $1;
