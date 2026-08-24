package com.fintrack.controllers;

import com.fintrack.dto.ApiResponse;
import com.fintrack.dto.SupportRequests.PublicSupportRequest;
import com.fintrack.dto.SupportRequests.UserSupportRequest;
import com.fintrack.models.User;
import com.fintrack.security.UserPrincipal;
import com.fintrack.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private static final Logger log = LoggerFactory.getLogger(SupportController.class);

    private final EmailService emailService;

    @Value("${fintrack.support.email:support@fintrack.app}")
    private String supportInbox;

    public SupportController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/public")
    public ResponseEntity<ApiResponse> handlePublicSupport(@RequestBody PublicSupportRequest request) {
        if (request.getName() == null || request.getEmail() == null ||
                request.getSubject() == null || request.getMessage() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("All fields are required.")
                    .build());
        }

        String emailBody = String.format("""
            <h3>New FinTrack Public Support Inquiry</h3>
            <p><strong>Name:</strong> %s</p>
            <p><strong>Email:</strong> %s</p>
            <p><strong>Subject:</strong> %s</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: #f4f4f5; padding: 15px; border-radius: 8px;">%s</p>
        """, request.getName(), request.getEmail(), request.getSubject(), request.getMessage());

        emailService.sendSupportEmail(
                supportInbox,
                request.getEmail(),
                request.getName(),
                "[FinTrack Public Support] " + request.getSubject(),
                emailBody
        );

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Support request sent successfully!")
                .build());
    }

    @PostMapping("/user")
    public ResponseEntity<ApiResponse> handleUserSupport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UserSupportRequest request) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(401).body(ApiResponse.builder().success(false).message("Unauthorized").build());
        }

        if (request.getSubject() == null || request.getCategory() == null ||
                request.getPriority() == null || request.getMessage() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("All fields are required.")
                    .build());
        }

        User user = principal.getUser();
        String userName = user.getName() != null ? user.getName() : "Workspace Member";
        String userEmail = user.getEmail();

        String emailBody = String.format("""
            <h3>New FinTrack Workspace Support Ticket</h3>
            <p><strong>User Name:</strong> %s</p>
            <p><strong>User Email:</strong> %s</p>
            <p><strong>Subject:</strong> %s</p>
            <p><strong>Category:</strong> %s</p>
            <p><strong>Priority:</strong> %s</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: #f4f4f5; padding: 15px; border-radius: 8px;">%s</p>
        """, userName, userEmail, request.getSubject(), request.getCategory(), request.getPriority(), request.getMessage());

        emailService.sendSupportEmail(
                supportInbox,
                userEmail,
                userName,
                String.format("[FinTrack Ticket] [%s] [%s] %s", request.getPriority(), request.getCategory(), request.getSubject()),
                emailBody
        );

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Support ticket submitted successfully!")
                .build());
    }
}
