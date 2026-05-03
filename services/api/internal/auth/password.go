package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const maxBcryptPasswordBytes = 72

var ErrInvalidPasswordInput = errors.New("invalid password input")

func HashPassword(plaintext string) (string, error) {
	if plaintext == "" || len([]byte(plaintext)) > maxBcryptPasswordBytes {
		return "", ErrInvalidPasswordInput
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(plaintext), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func VerifyPassword(plaintext string, hash string) (bool, error) {
	if plaintext == "" || len([]byte(plaintext)) > maxBcryptPasswordBytes || hash == "" {
		return false, ErrInvalidPasswordInput
	}

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(plaintext))
	if err == nil {
		return true, nil
	}
	if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
		return false, nil
	}

	return false, err
}
