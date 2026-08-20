-- name: GetAccessToken :one
SELECT "accessToken" FROM account WHERE "userId" = $1;
