package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
)

const sessionTokenBytes = 32

var ErrInvalidSessionToken = errors.New("invalid session token")

func GenerateSessionToken() (string, error) {
	token := make([]byte, sessionTokenBytes)
	if _, err := rand.Read(token); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(token), nil
}

func HashSessionToken(token string) (string, error) {
	if token == "" {
		return "", ErrInvalidSessionToken
	}
	decoded, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(decoded) != sessionTokenBytes || base64.RawURLEncoding.EncodeToString(decoded) != token {
		return "", ErrInvalidSessionToken
	}

	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:]), nil
}
