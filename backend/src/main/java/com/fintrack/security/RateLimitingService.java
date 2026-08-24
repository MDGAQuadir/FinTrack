package com.fintrack.security;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimitingService {

    private static final int MAX_OTP_PER_EMAIL = 5;
    private static final int MAX_OTP_PER_IP = 20;
    private static final long TIME_WINDOW_MS = 15 * 60 * 1000L; // 15 minutes
    private static final int MAX_VERIFICATION_ATTEMPTS = 5;

    // Sliding window token tracker
    private static class RequestBucket {
        long windowStart = System.currentTimeMillis();
        int requestCount = 0;
    }

    private final ConcurrentHashMap<String, RequestBucket> emailBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestBucket> ipBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicInteger> failedAttemptCounters = new ConcurrentHashMap<>();

    /**
     * Checks if an OTP request is allowed for both email and client IP.
     */
    public synchronized RateLimitResult tryAcquireOtpRequest(String email, String ipAddress) {
        long now = System.currentTimeMillis();

        // 1. Check Email Rate Limit
        if (email != null && !email.isBlank()) {
            String normEmail = email.trim().toLowerCase();
            RequestBucket eBucket = emailBuckets.computeIfAbsent(normEmail, k -> new RequestBucket());
            if (now - eBucket.windowStart > TIME_WINDOW_MS) {
                eBucket.windowStart = now;
                eBucket.requestCount = 0;
            }
            if (eBucket.requestCount >= MAX_OTP_PER_EMAIL) {
                long waitSeconds = (TIME_WINDOW_MS - (now - eBucket.windowStart)) / 1000L;
                return new RateLimitResult(false, Math.max(1, waitSeconds), "Too many OTP requests for this email. Please try again in " + waitSeconds + " seconds.");
            }
        }

        // 2. Check IP Rate Limit
        if (ipAddress != null && !ipAddress.isBlank()) {
            RequestBucket ipBucket = ipBuckets.computeIfAbsent(ipAddress, k -> new RequestBucket());
            if (now - ipBucket.windowStart > TIME_WINDOW_MS) {
                ipBucket.windowStart = now;
                ipBucket.requestCount = 0;
            }
            if (ipBucket.requestCount >= MAX_OTP_PER_IP) {
                long waitSeconds = (TIME_WINDOW_MS - (now - ipBucket.windowStart)) / 1000L;
                return new RateLimitResult(false, Math.max(1, waitSeconds), "Too many requests from this IP address. Please try again in " + waitSeconds + " seconds.");
            }
        }

        // 3. Increment counters
        if (email != null && !email.isBlank()) {
            emailBuckets.get(email.trim().toLowerCase()).requestCount++;
        }
        if (ipAddress != null && !ipAddress.isBlank()) {
            ipBuckets.get(ipAddress).requestCount++;
        }

        return new RateLimitResult(true, 0, null);
    }

    /**
     * Records a failed OTP verification attempt.
     * Returns false if user has exceeded 5 attempts and is locked out.
     */
    public boolean recordFailedAttempt(String email) {
        if (email == null || email.isBlank()) return true;
        String normEmail = email.trim().toLowerCase();
        AtomicInteger counter = failedAttemptCounters.computeIfAbsent(normEmail, k -> new AtomicInteger(0));
        return counter.incrementAndGet() < MAX_VERIFICATION_ATTEMPTS;
    }

    public boolean isLockedOut(String email) {
        if (email == null || email.isBlank()) return false;
        AtomicInteger counter = failedAttemptCounters.get(email.trim().toLowerCase());
        return counter != null && counter.get() >= MAX_VERIFICATION_ATTEMPTS;
    }

    public int getRemainingAttempts(String email) {
        if (email == null || email.isBlank()) return MAX_VERIFICATION_ATTEMPTS;
        AtomicInteger counter = failedAttemptCounters.get(email.trim().toLowerCase());
        int used = counter != null ? counter.get() : 0;
        return Math.max(0, MAX_VERIFICATION_ATTEMPTS - used);
    }

    public void resetFailedAttempts(String email) {
        if (email != null && !email.isBlank()) {
            failedAttemptCounters.remove(email.trim().toLowerCase());
        }
    }

    public static class RateLimitResult {
        private final boolean allowed;
        private final long retryAfterSeconds;
        private final String message;

        public RateLimitResult(boolean allowed, long retryAfterSeconds, String message) {
            this.allowed = allowed;
            this.retryAfterSeconds = retryAfterSeconds;
            this.message = message;
        }

        public boolean isAllowed() { return allowed; }
        public long getRetryAfterSeconds() { return retryAfterSeconds; }
        public String getMessage() { return message; }
    }
}
