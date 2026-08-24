package com.fintrack.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitingServiceTest {

    private RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService = new RateLimitingService();
    }

    @Test
    @DisplayName("1. Should allow up to 5 OTP requests per email and block 6th request")
    void testEmailRateLimiting() {
        String email = "abdulquadir@sharklasers.com";
        String ip = "192.168.1.10";

        for (int i = 1; i <= 5; i++) {
            var result = rateLimitingService.tryAcquireOtpRequest(email, ip);
            assertTrue(result.isAllowed(), "Request " + i + " should be allowed");
        }

        // 6th request should be blocked
        var result6 = rateLimitingService.tryAcquireOtpRequest(email, ip);
        assertFalse(result6.isAllowed(), "6th request within 15 min must be blocked");
        assertTrue(result6.getRetryAfterSeconds() > 0);
        assertTrue(result6.getMessage().contains("Too many OTP requests"));
    }

    @Test
    @DisplayName("2. Should allow up to 20 OTP requests per IP across multiple emails and block 21st")
    void testIpRateLimiting() {
        String ip = "10.0.0.99";

        for (int i = 1; i <= 20; i++) {
            String email = "user" + i + "@example.com";
            var result = rateLimitingService.tryAcquireOtpRequest(email, ip);
            assertTrue(result.isAllowed(), "Request " + i + " on IP should be allowed");
        }

        // 21st request from same IP should be blocked
        var result21 = rateLimitingService.tryAcquireOtpRequest("newuser@example.com", ip);
        assertFalse(result21.isAllowed(), "21st request from same IP must be blocked");
        assertTrue(result21.getMessage().contains("Too many requests from this IP"));
    }

    @Test
    @DisplayName("3. Should lock out after 5 consecutive failed OTP attempts")
    void testFailedAttemptLockout() {
        String email = "victim@example.com";

        // Attempts 1 to 4 should be allowed with decreasing remaining count
        for (int i = 1; i <= 4; i++) {
            boolean allowed = rateLimitingService.recordFailedAttempt(email);
            assertTrue(allowed, "Attempt " + i + " should still permit further tries");
        }

        assertEquals(1, rateLimitingService.getRemainingAttempts(email));

        // 5th attempt locks out
        boolean allowed5 = rateLimitingService.recordFailedAttempt(email);
        assertFalse(allowed5, "5th failed attempt should trigger lockout");
        assertTrue(rateLimitingService.isLockedOut(email));
        assertEquals(0, rateLimitingService.getRemainingAttempts(email));
    }

    @Test
    @DisplayName("4. Reset failed attempts after successful verification")
    void testResetFailedAttempts() {
        String email = "gooduser@example.com";

        rateLimitingService.recordFailedAttempt(email);
        rateLimitingService.recordFailedAttempt(email);
        assertEquals(3, rateLimitingService.getRemainingAttempts(email));

        rateLimitingService.resetFailedAttempts(email);
        assertEquals(5, rateLimitingService.getRemainingAttempts(email));
        assertFalse(rateLimitingService.isLockedOut(email));
    }
}
