package com.fintrack.controllers;

import com.fintrack.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class MockWebhookController {

    private static final Logger log = LoggerFactory.getLogger(MockWebhookController.class);

    @PostMapping("/mock-webhook")
    public ResponseEntity<ApiResponse> mockWebhook(@RequestBody(required = false) Map<String, Object> body) {
        log.info("\n==================================================");
        log.info("--- MOCK WEBHOOK RECEIVED REQUEST ---");
        if (body != null) {
            log.info("Body Keys: {}", body.keySet());
            if (body.containsKey("email")) log.info("Target Email: {}", body.get("email"));
            if (body.containsKey("otp")) log.info("OTP Code: {}", body.get("otp"));
            if (body.containsKey("startDate") && body.containsKey("endDate")) {
                log.info("Statement Period: {} to {}", body.get("startDate"), body.get("endDate"));
            }
        }
        log.info("==================================================\n");

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("[MOCK SUCCESS] Webhook received payload successfully.")
                .build());
    }
}
