package providers

import "time"

// RateLimiter implements a token bucket rate limiter for TMDB API
type RateLimiter struct {
	bucket   chan struct{}
	ticker   *time.Ticker
	stopChan chan struct{}
}

// NewRateLimiter creates a new rate limiter that allows up to 'rate' requests per second
func NewRateLimiter(rate int) *RateLimiter {
	rl := &RateLimiter{
		bucket:   make(chan struct{}, rate),
		ticker:   time.NewTicker(time.Second / time.Duration(rate)),
		stopChan: make(chan struct{}),
	}

	// Pre-fill the bucket
	for i := 0; i < rate; i++ {
		rl.bucket <- struct{}{}
	}

	// Start the refill goroutine
	go rl.refill()

	return rl
}

// Wait blocks until a request can be made
func (rl *RateLimiter) Wait() {
	<-rl.bucket
}

// refill periodically adds tokens to the bucket
func (rl *RateLimiter) refill() {
	for {
		select {
		case <-rl.ticker.C:
			select {
			case rl.bucket <- struct{}{}:
			default:
				// Bucket is full, skip
			}
		case <-rl.stopChan:
			return
		}
	}
}
