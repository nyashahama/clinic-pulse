package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
)

const apiKeyRandomBytes = 32
const apiKeyDisplayPrefixLength = 16

var ErrInvalidAPIKey = errors.New("invalid api key")

func GenerateAPIKey(environment string) (string, string, error) {
	environment = strings.TrimSpace(strings.ToLower(environment))
	if environment != "demo" && environment != "live" {
		return "", "", ErrInvalidAPIKey
	}

	randomBytes := make([]byte, apiKeyRandomBytes)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", err
	}

	secret := "cp_" + environment + "_" + base64.RawURLEncoding.EncodeToString(randomBytes)
	prefix := secret
	if len(prefix) > apiKeyDisplayPrefixLength {
		prefix = prefix[:apiKeyDisplayPrefixLength]
	}
	return secret, prefix, nil
}

func APIKeyEnvironment(secret string) (string, error) {
	switch {
	case strings.HasPrefix(secret, "cp_demo_"):
		return "demo", nil
	case strings.HasPrefix(secret, "cp_live_"):
		return "live", nil
	default:
		return "", ErrInvalidAPIKey
	}
}

func HashAPIKey(secret string, pepper string) (string, error) {
	if _, err := APIKeyEnvironment(secret); err != nil {
		return "", err
	}
	if strings.TrimSpace(secret) != secret || secret == "" {
		return "", ErrInvalidAPIKey
	}

	material := secret
	if pepper != "" {
		material = pepper + ":" + secret
	}
	hash := sha256.Sum256([]byte(material))
	return hex.EncodeToString(hash[:]), nil
}
