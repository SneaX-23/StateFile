package util

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/chacha20poly1305"
)

func DecryptBetterAuthAccessToken(
	encryptedToken string,
	betterAuthSecret string,
) (string, error) {
	// Better Auth:
	// key = SHA-256(BETTER_AUTH_SECRET)
	key := sha256.Sum256([]byte(betterAuthSecret))

	// XChaCha20-Poly1305
	aead, err := chacha20poly1305.NewX(key[:])
	if err != nil {
		return "", fmt.Errorf("create cipher: %w", err)
	}

	// Stored by Better Auth as hex.
	data, err := hex.DecodeString(encryptedToken)
	if err != nil {
		return "", fmt.Errorf("decode ciphertext: %w", err)
	}

	// XChaCha20 uses a 24-byte nonce.
	const nonceSize = 24

	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce := data[:nonceSize]
	ciphertext := data[nonceSize:]

	plaintext, err := aead.Open(
		nil,
		nonce,
		ciphertext,
		nil,
	)
	if err != nil {
		return "", fmt.Errorf("decrypt access token: %w", err)
	}

	return string(plaintext), nil
}
