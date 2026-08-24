package com.fintrack.adapters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.dto.UnifiedPaymentEvent;
import com.fintrack.dto.UnifiedPaymentEvent.TransactionDirection;
import com.fintrack.security.WebhookSignatureHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class StripeWebhookAdapter implements PaymentWebhookProvider {

    private static final long TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return "stripe";
    }

    @Override
    public boolean verifySignature(byte[] rawPayload, Map<String, String> headers, String secret) {
        if (secret == null || secret.isBlank()) return true;

        String sigHeader = headers.getOrDefault("stripe-signature",
                headers.getOrDefault("Stripe-Signature", ""));

        if (sigHeader == null || sigHeader.isBlank()) {
            return false;
        }

        String timestamp = null;
        String signature = null;

        String[] parts = sigHeader.split(",");
        for (String part : parts) {
            String[] kv = part.trim().split("=", 2);
            if (kv.length == 2) {
                if ("t".equalsIgnoreCase(kv[0])) {
                    timestamp = kv[1];
                } else if ("v1".equalsIgnoreCase(kv[0])) {
                    signature = kv[1];
                }
            }
        }

        if (timestamp == null || signature == null) {
            return false;
        }

        try {
            long eventTime = Long.parseLong(timestamp);
            long now = System.currentTimeMillis() / 1000L;
            if (Math.abs(now - eventTime) > TIMESTAMP_TOLERANCE_SECONDS) {
                return false; // Replay attack protection
            }
        } catch (NumberFormatException e) {
            return false;
        }

        // Stripe signature payload format: ${timestamp}.${rawPayload}
        String payloadString = new String(rawPayload, StandardCharsets.UTF_8);
        String signedPayload = timestamp + "." + payloadString;
        String expected = WebhookSignatureHelper.computeHmacSha256(signedPayload.getBytes(StandardCharsets.UTF_8), secret);

        return WebhookSignatureHelper.constantTimeEquals(expected, signature);
    }

    @Override
    public UnifiedPaymentEvent parsePayload(byte[] rawPayload, Map<String, String> headers) throws Exception {
        String json = new String(rawPayload, StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(json);

        String eventId = root.has("id") ? root.get("id").asText() : "evt_stripe_" + System.currentTimeMillis();
        String eventType = root.has("type") ? root.get("type").asText() : "payment_intent.succeeded";

        JsonNode dataObj = root.path("data").path("object");

        Double amount = 0.0;
        String currency = "INR";
        String userEmail = null;
        String userId = null;
        String description = "Stripe Payment";
        String merchant = "Stripe Payment";
        String reference = dataObj.has("id") ? dataObj.get("id").asText() : eventId;

        TransactionDirection direction = TransactionDirection.OUTGOING_DEBIT; // Default Stripe charge = debit

        if (!dataObj.isMissingNode()) {
            if (dataObj.has("amount")) {
                amount = dataObj.get("amount").asDouble() / 100.0;
            }
            if (dataObj.has("currency")) {
                currency = dataObj.get("currency").asText().toUpperCase();
            }
            if (dataObj.has("receipt_email") && !dataObj.get("receipt_email").isNull()) {
                userEmail = dataObj.get("receipt_email").asText();
            } else if (dataObj.has("customer_email") && !dataObj.get("customer_email").isNull()) {
                userEmail = dataObj.get("customer_email").asText();
            }
            if (dataObj.has("description") && !dataObj.get("description").isNull()) {
                description = dataObj.get("description").asText();
                merchant = description;
            }

            JsonNode metadata = dataObj.path("metadata");
            if (metadata.has("user_id")) {
                userId = metadata.get("user_id").asText();
            }
            if (metadata.has("user_email") && userEmail == null) {
                userEmail = metadata.get("user_email").asText();
            }
            if (metadata.has("merchant")) {
                merchant = metadata.get("merchant").asText();
            }
            if (metadata.has("direction")) {
                String dir = metadata.get("direction").asText().toUpperCase();
                direction = dir.contains("CREDIT") || dir.contains("IN") ?
                        TransactionDirection.INCOMING_CREDIT : TransactionDirection.OUTGOING_DEBIT;
            }
        }

        if (eventType.contains("refund")) {
            direction = TransactionDirection.INCOMING_CREDIT; // Refund received back to customer = Credit
        }

        UnifiedPaymentEvent event = new UnifiedPaymentEvent(
                getProviderName(),
                eventId,
                eventType,
                userId,
                userEmail,
                amount,
                currency,
                direction,
                merchant,
                description,
                reference
        );
        event.setRawPayloadHash(WebhookSignatureHelper.computeSha256Hash(rawPayload));
        return event;
    }
}
