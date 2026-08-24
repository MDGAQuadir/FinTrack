package com.fintrack.controllers;

import com.fintrack.dto.ApiResponse;
import com.fintrack.dto.AuthRequests.*;
import com.fintrack.models.User;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.JwtUtil;
import com.fintrack.security.UserPrincipal;
import com.fintrack.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Date;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final com.fintrack.security.RateLimitingService rateLimitingService;
    private final SecureRandom random = new SecureRandom();

    @Value("${fintrack.development-mode:true}")
    private boolean devMode;

    public AuthController(
            UserRepository userRepository,
            EmailService emailService,
            JwtUtil jwtUtil,
            com.fintrack.security.RateLimitingService rateLimitingService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
        this.rateLimitingService = rateLimitingService;
    }

    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    private String generateOtp() {
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private User sanitizeUser(User user) {
        if (user == null) return null;
        User sanitized = new User();
        sanitized.setId(user.getId());
        sanitized.setEmail(user.getEmail());
        sanitized.setName(user.getName());
        sanitized.setPhone(user.getPhone());
        sanitized.setOccupation(user.getOccupation());
        sanitized.setCity(user.getCity());
        sanitized.setAddress(user.getAddress());
        sanitized.setZipcode(user.getZipcode());
        sanitized.setState(user.getState());
        sanitized.setCountry(user.getCountry());
        sanitized.setBalance(user.getBalance());
        sanitized.setLastLoginRequest(user.getLastLoginRequest());
        return sanitized;
    }

    @PostMapping("/check")
    public ResponseEntity<ApiResponse> checkEmail(
            @RequestBody CheckEmailRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        String email = request.getResolvedEmail();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Email is required").build());
        }

        String normalizedEmail = email.trim().toLowerCase();
        String clientIp = getClientIp(httpRequest);

        // Multi-dimensional Rate Limiting (Email + IP)
        var rateCheck = rateLimitingService.tryAcquireOtpRequest(normalizedEmail, clientIp);
        if (!rateCheck.isAllowed()) {
            log.warn("🚨 [RateLimit] OTP limit reached for email '{}' or IP '{}'", normalizedEmail, clientIp);
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(rateCheck.getRetryAfterSeconds()))
                    .body(ApiResponse.builder()
                            .success(false)
                            .message(rateCheck.getMessage())
                            .build());
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setLastLoginRequest(new Date());
            userRepository.save(user);

            // Direct instant login without OTP barrier
            String token = jwtUtil.generateToken(user.getId(), user.getEmail());

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .exists(true)
                    .token(token)
                    .user(sanitizeUser(user))
                    .build());
        } else {
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .exists(false)
                    .build());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(
            @RequestBody RegisterRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        String email = request.getResolvedEmail();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Email is required").build());
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            User existing = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
            String token = jwtUtil.generateToken(existing.getId(), existing.getEmail());
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .token(token)
                    .user(sanitizeUser(existing))
                    .build());
        }

        User newUser = new User();
        newUser.setEmail(normalizedEmail);
        newUser.setName(request.getResolvedName() != null ? request.getResolvedName() : "FinTrack User");
        newUser.setPhone(request.getResolvedPhone() != null ? request.getResolvedPhone() : "");
        newUser.setOccupation(request.getResolvedOccupation() != null ? request.getResolvedOccupation() : "");
        newUser.setCity(request.getResolvedCity() != null ? request.getResolvedCity() : "");
        newUser.setBalance(null);
        newUser.setLastLoginRequest(new Date());

        userRepository.save(newUser);

        // Direct instant login upon registration
        String token = jwtUtil.generateToken(newUser.getId(), newUser.getEmail());

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .token(token)
                .user(sanitizeUser(newUser))
                .build());
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        String email = request.getResolvedEmail();
        String enteredOtp = request.getResolvedOtp();

        if (email == null || enteredOtp == null || email.isBlank() || enteredOtp.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Email and OTP are required").build());
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found.").build());
        }

        User user = userOpt.get();

        // 1. Lockout Check
        if (rateLimitingService.isLockedOut(normalizedEmail)) {
            user.setOtp(null);
            user.setOtpExpires(null);
            userRepository.save(user);
            return ResponseEntity.status(429).body(ApiResponse.builder()
                    .success(false)
                    .message("Too many failed attempts. This OTP has been invalidated for security. Please request a new code.")
                    .build());
        }

        // 2. Expiration Check
        if (user.getOtpExpires() != null && new Date().after(user.getOtpExpires())) {
            user.setOtp(null);
            user.setOtpExpires(null);
            userRepository.save(user);
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("OTP has expired (5 minute limit). Please request a new one.").build());
        }

        // 3. Match Verification
        if (user.getOtp() == null || !user.getOtp().trim().equals(enteredOtp.trim())) {
            boolean allowed = rateLimitingService.recordFailedAttempt(normalizedEmail);
            if (!allowed) {
                user.setOtp(null);
                user.setOtpExpires(null);
                userRepository.save(user);
                return ResponseEntity.status(429).body(ApiResponse.builder()
                        .success(false)
                        .message("Too many failed attempts. This OTP has been invalidated for security. Please request a new code.")
                        .build());
            }
            int remaining = rateLimitingService.getRemainingAttempts(normalizedEmail);
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Invalid OTP code. " + remaining + " attempts remaining.")
                    .build());
        }

        // 4. Single-Use Invalidation
        user.setOtp(null);
        user.setOtpExpires(null);
        userRepository.save(user);
        rateLimitingService.resetFailedAttempts(normalizedEmail);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .user(sanitizeUser(user))
                .token(token)
                .build());
    }

    @PostMapping("/me")
    public ResponseEntity<ApiResponse> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.builder().success(false).message("Unauthorized").build());
        }

        Optional<User> userOpt = userRepository.findById(principal.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found.").build());
        }

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .user(sanitizeUser(userOpt.get()))
                .build());
    }

    @PostMapping("/balance")
    public ResponseEntity<ApiResponse> updateBalance(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateBalanceRequest request) {

        String userId = principal != null ? principal.getId() : request.getUserRowId();
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("User ID is required").build());
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found.").build());
        }

        User user = userOpt.get();
        double balanceVal = request.getBalance() != null ? Math.round(request.getBalance() * 100.0) / 100.0 : 0.0;
        user.setInitialBalance(balanceVal);
        user.setBalance(balanceVal);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .user(sanitizeUser(user))
                .build());
    }

    @PostMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateProfileRequest request) {

        String userId = principal != null ? principal.getId() : request.getUserRowId();
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("User ID is required").build());
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found.").build());
        }

        User user = userOpt.get();
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getOccupation() != null) user.setOccupation(request.getOccupation());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getZipcode() != null) user.setZipcode(request.getZipcode());
        if (request.getState() != null) user.setState(request.getState());
        if (request.getCountry() != null) user.setCountry(request.getCountry());

        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .user(sanitizeUser(user))
                .build());
    }
}
