package com.fintrack.adapters;

import com.fintrack.dto.UnifiedPaymentEvent;
import java.util.Map;

public interface PaymentWebhookProvider {

    /**
     * Unique identifier slug for this provider (e.g. "razorpay", "stripe", "generic").
     */
    String getProviderName();

    /**
     * Verifies cryptographic signature using raw payload bytes and request headers.
     */
    boolean verifySignature(byte[] rawPayload, Map<String, String> headers, String secret);

    /**
     * Parses raw webhook payload and headers into a normalized UnifiedPaymentEvent.
     */
    UnifiedPaymentEvent parsePayload(byte[] rawPayload, Map<String, String> headers) throws Exception;
}
