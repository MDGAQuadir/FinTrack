package com.fintrack.adapters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.dto.UnifiedPaymentEvent;
import com.fintrack.dto.UnifiedPaymentEvent.TransactionDirection;
import com.fintrack.security.WebhookSignatureHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Component
public class GenericUpiWebhookAdapter implements PaymentWebhookProvider {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return "generic";
    }

    @Override
    public boolean verifySignature(byte[] rawPayload, Map<String, String> headers, String secret) {
        if (secret == null || secret.isBlank()) return true;

        String signature = headers.getOrDefault("x-webhook-signature",
                headers.getOrDefault("X-Webhook-Signature", headers.getOrDefault("signature", "")));

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

        String eventId = root.has("eventId") ? root.get("eventId").asText() :
                root.has("id") ? root.get("id").asText() : "evt_" + UUID.randomUUID().toString().substring(0, 8);

        String eventType = root.has("eventType") ? root.get("eventType").asText() :
                root.has("type") ? root.get("type").asText() : "payment.success";

        String userId = root.has("userId") ? root.get("userId").asText() : null;
        String userEmail = root.has("userEmail") ? root.get("userEmail").asText() :
                root.has("email") ? root.get("email").asText() : null;

        Double amount = root.has("amount") ? root.get("amount").asDouble() : 0.0;
        String currency = root.has("currency") ? root.get("currency").asText() : "INR";

        String directionStr = root.has("direction") ? root.get("direction").asText().toUpperCase() : "INCOMING_CREDIT";
        TransactionDirection direction = directionStr.contains("DEBIT") || directionStr.contains("OUT") ?
                TransactionDirection.OUTGOING_DEBIT : TransactionDirection.INCOMING_CREDIT;

        String merchant = root.has("merchant") ? root.get("merchant").asText() :
                root.has("payer") ? root.get("payer").asText() : "UPI Transaction";

        String description = root.has("description") ? root.get("description").asText() :
                root.has("note") ? root.get("note").asText() : merchant;

        String reference = root.has("referenceNumber") ? root.get("referenceNumber").asText() :
                root.has("utr") ? root.get("utr").asText() : eventId;

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
