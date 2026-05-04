package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"unicode"
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
	environment, _, err := validateAPIKey(secret)
	if err != nil {
		return "", err
	}
	return environment, nil
}

func HashAPIKey(secret string, pepper string) (string, error) {
	if _, _, err := validateAPIKey(secret); err != nil {
		return "", err
	}

	material := secret
	if pepper != "" {
		material = pepper + ":" + secret
	}
	hash := sha256.Sum256([]byte(material))
	return hex.EncodeToString(hash[:]), nil
}

func validateAPIKey(secret string) (string, []byte, error) {
	if secret == "" || strings.ContainsFunc(secret, unicode.IsSpace) {
		return "", nil, ErrInvalidAPIKey
	}

	var environment string
	var suffix string
	switch {
	case strings.HasPrefix(secret, "cp_demo_"):
		environment = "demo"
		suffix = strings.TrimPrefix(secret, "cp_demo_")
	case strings.HasPrefix(secret, "cp_live_"):
		environment = "live"
		suffix = strings.TrimPrefix(secret, "cp_live_")
	default:
		return "", nil, ErrInvalidAPIKey
	}
	if suffix == "" {
		return "", nil, ErrInvalidAPIKey
	}

	decoded, err := base64.RawURLEncoding.DecodeString(suffix)
	if err != nil || len(decoded) != apiKeyRandomBytes || suffix != base64.RawURLEncoding.EncodeToString(decoded) {
		return "", nil, ErrInvalidAPIKey
	}
	return environment, decoded, nil
}
