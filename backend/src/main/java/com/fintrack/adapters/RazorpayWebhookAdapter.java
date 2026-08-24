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
public class RazorpayWebhookAdapter implements PaymentWebhookProvider {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return "razorpay";
    }

    @Override
    public boolean verifySignature(byte[] rawPayload, Map<String, String> headers, String secret) {
        if (secret == null || secret.isBlank()) return true;

        String signature = headers.getOrDefault("x-razorpay-signature",
                headers.getOrDefault("X-Razorpay-Signature", ""));

        if (signature == null || signature.isBlank()) {
            return false;
        }

        String expected = WebhookSignatureHelper.computeHmacSha256(rawPayload, secret);
        return WebhookSignatureHelper.constantTimeEquals(expected, signature);
    }

    @Override
    public UnifiedPaymentEvent parsePayload(byte[] rawPayload, Map<String, String> headers) throws Exception {
        String json = new String(rawPayload, StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(json);

        String eventType = root.has("event") ? root.get("event").asText() : "payment.captured";
        String eventId = root.has("event_id") ? root.get("event_id").asText() :
                root.has("id") ? root.get("id").asText() : null;

        JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
        JsonNode refundEntity = root.path("payload").path("refund").path("entity");

        Double amount = 0.0;
        String currency = "INR";
        String userEmail = null;
        String userId = null;
        String description = "Razorpay Transaction";
        String merchant = "Razorpay Payment";
        String reference = null;

        TransactionDirection direction = TransactionDirection.INCOMING_CREDIT;

        if (!paymentEntity.isMissingNode()) {
            // Razorpay amounts are in paise (divide by 100)
            if (paymentEntity.has("amount")) {
                amount = paymentEntity.get("amount").asDouble() / 100.0;
            }
            if (paymentEntity.has("currency")) {
                currency = paymentEntity.get("currency").asText();
            }
            if (paymentEntity.has("email")) {
                userEmail = paymentEntity.get("email").asText();
            }
            if (paymentEntity.has("id")) {
                reference = paymentEntity.get("id").asText();
                if (eventId == null) eventId = reference;
            }
            if (paymentEntity.has("description") && !paymentEntity.get("description").asText().isBlank()) {
                description = paymentEntity.get("description").asText();
                merchant = description;
            }

            JsonNode notes = paymentEntity.path("notes");
            if (notes.has("user_id")) {
                userId = notes.get("user_id").asText();
            }
            if (notes.has("user_email") && userEmail == null) {
                userEmail = notes.get("user_email").asText();
            }
            if (notes.has("merchant")) {
                merchant = notes.get("merchant").asText();
            }
            if (notes.has("direction")) {
                String dir = notes.get("direction").asText().toUpperCase();
                direction = dir.contains("DEBIT") || dir.contains("OUT") ?
                        TransactionDirection.OUTGOING_DEBIT : TransactionDirection.INCOMING_CREDIT;
            }
        }

        if (eventType.contains("refund")) {
            direction = TransactionDirection.OUTGOING_DEBIT;
            if (!refundEntity.isMissingNode() && refundEntity.has("amount")) {
                amount = refundEntity.get("amount").asDouble() / 100.0;
            }
        }

        UnifiedPaymentEvent event = new UnifiedPaymentEvent(
                getProviderName(),
                eventId != null ? eventId : "rzp_evt_" + System.currentTimeMillis(),
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
