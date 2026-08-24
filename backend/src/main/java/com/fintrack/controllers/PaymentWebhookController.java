package com.fintrack.controllers;

import com.fintrack.adapters.PaymentWebhookProvider;
import com.fintrack.adapters.WebhookProviderResolver;
import com.fintrack.dto.UnifiedPaymentEvent;
import com.fintrack.dto.UnifiedPaymentEvent.TransactionDirection;
import com.fintrack.models.User;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.UserPrincipal;
import com.fintrack.service.PaymentWebhookService;
import com.fintrack.service.PaymentWebhookService.WebhookProcessingResult;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/webhooks/payment")
public class PaymentWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookController.class);

    private final WebhookProviderResolver providerResolver;
    private final PaymentWebhookService paymentWebhookService;
    private final UserRepository userRepository;

    @Value("${fintrack.webhook.secret.razorpay:}")
    private String razorpaySecret;

    @Value("${fintrack.webhook.secret.stripe:}")
    private String stripeSecret;

    @Value("${fintrack.webhook.secret.generic:}")
    private String genericSecret;

    @Value("${fintrack.development-mode:true}")
    private boolean devMode;

    public PaymentWebhookController(
            WebhookProviderResolver providerResolver,
            PaymentWebhookService paymentWebhookService,
            UserRepository userRepository) {
        this.providerResolver = providerResolver;
        this.paymentWebhookService = paymentWebhookService;
        this.userRepository = userRepository;
    }

    private String getSecretForProvider(String provider) {
        if ("razorpay".equalsIgnoreCase(provider)) return razorpaySecret;
        if ("stripe".equalsIgnoreCase(provider)) return stripeSecret;
        return genericSecret;
    }

    private Map<String, String> extractHeaders(HttpServletRequest request) {
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            headers.put(name.toLowerCase(), request.getHeader(name));
        }
        return headers;
    }

    /**
     * Primary endpoint for external payment providers (Razorpay, Stripe, Generic UPI).
     */
    @PostMapping("/{provider}")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @PathVariable("provider") String providerSlug,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        Optional<PaymentWebhookProvider> optionalProvider = providerResolver.resolve(providerSlug);
        if (optionalProvider.isEmpty()) {
            response.put("success", false);
            response.put("error", "Unsupported payment webhook provider: " + providerSlug);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        PaymentWebhookProvider provider = optionalProvider.get();

        try {
            byte[] rawBytes = request.getInputStream().readAllBytes();
            if (rawBytes == null || rawBytes.length == 0) {
                response.put("success", false);
                response.put("error", "Empty webhook payload received");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            Map<String, String> headers = extractHeaders(request);
            String secret = getSecretForProvider(provider.getProviderName());

            // Cryptographic raw-byte signature verification
            boolean signatureValid = provider.verifySignature(rawBytes, headers, secret);
            if (!signatureValid) {
                log.warn("🚨 [Security] Webhook signature verification failed for provider '{}'", provider.getProviderName());
                response.put("success", false);
                response.put("error", "Invalid or missing webhook signature");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            UnifiedPaymentEvent event = provider.parsePayload(rawBytes, headers);
            WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(event);

            response.put("success", result.isSuccess());
            response.put("duplicate", result.isDuplicate());
            response.put("message", result.getMessage());
            if (result.getUpdatedBalance() != null) {
                response.put("updatedBalance", result.getUpdatedBalance());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to process {} webhook: {}", providerSlug, e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Internal error processing payment event: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * DTO for simulated webhook requests from the authenticated frontend.
     */
    public static class WebhookSimulationRequest {
        public String provider;
        public String eventType;
        public Double amount;
        public String currency;
        public String direction; // "CREDIT" / "DEBIT"
        public String merchantOrPayer;
        public String description;
        public String referenceNumber;
    }

    /**
     * Protected Simulation Endpoint for developers and authenticated users.
     */
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulateWebhook(
            @RequestBody WebhookSimulationRequest simRequest,
            @RequestParam(value = "email", required = false) String emailParam,
            @AuthenticationPrincipal UserPrincipal principal) {

        Map<String, Object> response = new HashMap<>();

        // Resolve authenticated user
        User user = null;
        if (principal != null && principal.getUser() != null) {
            user = principal.getUser();
        } else {
            String email = principal != null ? principal.getEmail() : emailParam;
            if (email != null && !email.isBlank()) {
                user = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase()).orElse(null);
            }
        }

        if (user == null) {
            response.put("success", false);
            response.put("error", "Authentication required to simulate payment webhooks.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        if (simRequest == null || simRequest.amount == null || simRequest.amount <= 0) {
            response.put("success", false);
            response.put("error", "Amount must be greater than zero.");
            return ResponseEntity.badRequest().body(response);
        }

        String provider = simRequest.provider != null && !simRequest.provider.isBlank() ? simRequest.provider : "generic";
        String eventId = "sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String eventType = simRequest.eventType != null ? simRequest.eventType : "payment.simulated";

        TransactionDirection direction = "DEBIT".equalsIgnoreCase(simRequest.direction) || "OUTGOING".equalsIgnoreCase(simRequest.direction) ?
                TransactionDirection.OUTGOING_DEBIT : TransactionDirection.INCOMING_CREDIT;

        String merchant = simRequest.merchantOrPayer != null && !simRequest.merchantOrPayer.isBlank() ?
                simRequest.merchantOrPayer : (direction == TransactionDirection.INCOMING_CREDIT ? "Simulated Inflow" : "Simulated Outflow");

        String description = simRequest.description != null && !simRequest.description.isBlank() ?
                simRequest.description : merchant;

        String ref = simRequest.referenceNumber != null && !simRequest.referenceNumber.isBlank() ?
                simRequest.referenceNumber : "REF-" + System.currentTimeMillis();

        UnifiedPaymentEvent event = new UnifiedPaymentEvent(
                provider,
                eventId,
                eventType,
                user.getId(),
                user.getEmail(),
                simRequest.amount,
                simRequest.currency != null ? simRequest.currency : "INR",
                direction,
                merchant,
                description,
                ref
        );

        WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(event);

        response.put("success", result.isSuccess());
        response.put("duplicate", result.isDuplicate());
        response.put("message", result.getMessage());
        response.put("eventId", eventId);
        response.put("direction", direction.name());
        response.put("amount", simRequest.amount);
        response.put("merchant", merchant);
        response.put("updatedBalance", result.getUpdatedBalance());

        return ResponseEntity.ok(response);
    }
}
