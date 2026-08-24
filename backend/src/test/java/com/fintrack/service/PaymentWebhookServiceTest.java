package com.fintrack.service;

import com.fintrack.adapters.GenericUpiWebhookAdapter;
import com.fintrack.adapters.RazorpayWebhookAdapter;
import com.fintrack.adapters.StripeWebhookAdapter;
import com.fintrack.controllers.LedgerController;
import com.fintrack.dto.UnifiedPaymentEvent;
import com.fintrack.dto.UnifiedPaymentEvent.TransactionDirection;
import com.fintrack.models.Credit;
import com.fintrack.models.Debit;
import com.fintrack.models.Unified;
import com.fintrack.models.User;
import com.fintrack.models.WebhookEvent;
import com.fintrack.repository.CreditRepository;
import com.fintrack.repository.DebitRepository;
import com.fintrack.repository.UnifiedRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.repository.WebhookEventRepository;
import com.fintrack.security.WebhookSignatureHelper;
import com.fintrack.service.PaymentWebhookService.WebhookProcessingResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.dao.DataIntegrityViolationException;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PaymentWebhookServiceTest {

    private WebhookEventRepository webhookEventRepository;
    private UserRepository userRepository;
    private CreditRepository creditRepository;
    private DebitRepository debitRepository;
    private UnifiedRepository unifiedRepository;
    private SmartCategorizerService categorizerService;
    private LedgerRecalculationService recalculationService;
    private PaymentWebhookService paymentWebhookService;

    private RazorpayWebhookAdapter razorpayAdapter;
    private StripeWebhookAdapter stripeAdapter;
    private GenericUpiWebhookAdapter genericAdapter;

    private User mockUser;

    @BeforeEach
    void setUp() {
        webhookEventRepository = mock(WebhookEventRepository.class);
        userRepository = mock(UserRepository.class);
        creditRepository = mock(CreditRepository.class);
        debitRepository = mock(DebitRepository.class);
        unifiedRepository = mock(UnifiedRepository.class);
        categorizerService = new SmartCategorizerService();
        recalculationService = new LedgerRecalculationService(unifiedRepository, userRepository);

        paymentWebhookService = new PaymentWebhookService(
                webhookEventRepository,
                userRepository,
                creditRepository,
                debitRepository,
                unifiedRepository,
                categorizerService,
                recalculationService
        );

        razorpayAdapter = new RazorpayWebhookAdapter();
        stripeAdapter = new StripeWebhookAdapter();
        genericAdapter = new GenericUpiWebhookAdapter();

        mockUser = new User();
        mockUser.setId("user-uuid-1234");
        mockUser.setEmail("abdulquadir@sharklasers.com");
        mockUser.setBalance(5000.0);

        when(userRepository.findById("user-uuid-1234")).thenReturn(Optional.of(mockUser));
        when(userRepository.findByEmailIgnoreCase("abdulquadir@sharklasers.com")).thenReturn(Optional.of(mockUser));
        when(unifiedRepository.findByEmailIgnoreCaseOrderByCreatedAtDesc(anyString())).thenReturn(java.util.Collections.emptyList());
    }

    @Test
    @DisplayName("1. Razorpay: Valid HMAC SHA-256 signature verification should pass")
    void testRazorpayValidSignature() {
        String secret = "rzp_test_secret_123";
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"amount\":50000}}}}";
        byte[] rawBytes = payload.getBytes(StandardCharsets.UTF_8);

        String validSignature = WebhookSignatureHelper.computeHmacSha256(rawBytes, secret);
        Map<String, String> headers = Map.of("x-razorpay-signature", validSignature);

        assertTrue(razorpayAdapter.verifySignature(rawBytes, headers, secret));
    }

    @Test
    @DisplayName("2. Razorpay: Tampered payload or invalid signature should fail")
    void testRazorpayInvalidSignature() {
        String secret = "rzp_test_secret_123";
        String payload = "{\"event\":\"payment.captured\"}";
        byte[] rawBytes = payload.getBytes(StandardCharsets.UTF_8);

        Map<String, String> headers = Map.of("x-razorpay-signature", "invalid_tampered_signature_hex");
        assertFalse(razorpayAdapter.verifySignature(rawBytes, headers, secret));
    }

    @Test
    @DisplayName("3. Stripe: Valid timestamped HMAC signature verification should pass")
    void testStripeValidSignatureWithTimestamp() {
        String secret = "whsec_stripe_test_key";
        String payload = "{\"type\":\"payment_intent.succeeded\",\"data\":{\"object\":{\"amount\":120000}}}";
        byte[] rawBytes = payload.getBytes(StandardCharsets.UTF_8);

        long nowSec = System.currentTimeMillis() / 1000L;
        String signedPayload = nowSec + "." + payload;
        String validSignature = WebhookSignatureHelper.computeHmacSha256(signedPayload.getBytes(StandardCharsets.UTF_8), secret);

        String stripeHeader = "t=" + nowSec + ",v1=" + validSignature;
        Map<String, String> headers = Map.of("stripe-signature", stripeHeader);

        assertTrue(stripeAdapter.verifySignature(rawBytes, headers, secret));
    }

    @Test
    @DisplayName("4. Stripe: Replay attack with expired timestamp (>300s) should fail")
    void testStripeExpiredTimestampReplayAttack() {
        String secret = "whsec_stripe_test_key";
        String payload = "{\"type\":\"payment_intent.succeeded\"}";
        byte[] rawBytes = payload.getBytes(StandardCharsets.UTF_8);

        long expiredTimestamp = (System.currentTimeMillis() / 1000L) - 400; // 400s ago
        String signedPayload = expiredTimestamp + "." + payload;
        String signature = WebhookSignatureHelper.computeHmacSha256(signedPayload.getBytes(StandardCharsets.UTF_8), secret);

        Map<String, String> headers = Map.of("stripe-signature", "t=" + expiredTimestamp + ",v1=" + signature);
        assertFalse(stripeAdapter.verifySignature(rawBytes, headers, secret));
    }

    @Test
    @DisplayName("5. Stripe: Missing signature header should fail")
    void testStripeMissingSignatureHeader() {
        byte[] rawBytes = "{}".getBytes(StandardCharsets.UTF_8);
        assertFalse(stripeAdapter.verifySignature(rawBytes, Map.of(), "secret"));
    }

    @Test
    @DisplayName("6. Idempotency: First-time event is persisted and processed")
    void testIdempotencyFirstEventSuccess() {
        UnifiedPaymentEvent event = new UnifiedPaymentEvent(
                "razorpay", "pay_001", "payment.captured",
                "user-uuid-1234", "abdulquadir@sharklasers.com",
                500.0, "INR", TransactionDirection.INCOMING_CREDIT,
                "Swiggy Refund", "Refund for Order 123", "pay_001"
        );

        WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(event);

        assertTrue(result.isSuccess());
        assertFalse(result.isDuplicate());
        verify(webhookEventRepository, times(1)).saveAndFlush(any(WebhookEvent.class));
        verify(creditRepository, times(1)).save(any(Credit.class));
        verify(unifiedRepository, times(1)).save(any(Unified.class));
    }

    @Test
    @DisplayName("7. Idempotency: Duplicate event (DataIntegrityViolation) is ignored safely")
    void testIdempotencyDuplicateEventIgnored() {
        UnifiedPaymentEvent event = new UnifiedPaymentEvent(
                "razorpay", "pay_duplicate_001", "payment.captured",
                "user-uuid-1234", "abdulquadir@sharklasers.com",
                500.0, "INR", TransactionDirection.INCOMING_CREDIT,
                "Swiggy", "Test duplicate", "pay_duplicate_001"
        );

        // Simulate database unique constraint violation
        doThrow(new DataIntegrityViolationException("Duplicate key uk_webhook_provider_event"))
                .when(webhookEventRepository).saveAndFlush(any(WebhookEvent.class));

        WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(event);

        assertTrue(result.isSuccess(), "Duplicate handling should return success acknowledgment");
        assertTrue(result.isDuplicate(), "Should be flagged as duplicate");
        verify(creditRepository, never()).save(any(Credit.class));
        verify(debitRepository, never()).save(any(Debit.class));
        verify(unifiedRepository, never()).save(any(Unified.class));
    }

    @Test
    @DisplayName("8. Razorpay: payment.captured creates Credit transaction with paise converted to rupees")
    void testRazorpayPaymentCapturedCreditFlow() throws Exception {
        String payload = """
                {
                    "event": "payment.captured",
                    "payload": {
                        "payment": {
                            "entity": {
                                "id": "pay_987123",
                                "amount": 8500000,
                                "currency": "INR",
                                "email": "abdulquadir@sharklasers.com",
                                "description": "Salary Credit Acme Corp",
                                "notes": {
                                    "user_id": "user-uuid-1234"
                                }
                            }
                        }
                    }
                }
                """;

        UnifiedPaymentEvent event = razorpayAdapter.parsePayload(payload.getBytes(StandardCharsets.UTF_8), Map.of());

        assertEquals(85000.0, event.getAmount(), "8500000 paise should normalize to ₹85,000.00");
        assertEquals("Salary Credit Acme Corp", event.getMerchantOrPayer());
        assertEquals(TransactionDirection.INCOMING_CREDIT, event.getDirection());

        paymentWebhookService.processPaymentEvent(event);

        ArgumentCaptor<Credit> creditCaptor = ArgumentCaptor.forClass(Credit.class);
        verify(creditRepository).save(creditCaptor.capture());
        Credit savedCredit = creditCaptor.getValue();

        assertEquals(85000.0, savedCredit.getAmount());
        assertEquals("Salary", savedCredit.getPurpose(), "Should be classified as Salary");
        assertEquals("abdulquadir@sharklasers.com", savedCredit.getEmail());
    }

    @Test
    @DisplayName("9. Stripe: payment_intent.succeeded creates Debit transaction with cents converted")
    void testStripePaymentIntentDebitFlow() throws Exception {
        String payload = """
                {
                    "id": "evt_stripe_112233",
                    "type": "payment_intent.succeeded",
                    "data": {
                        "object": {
                            "id": "pi_112233",
                            "amount": 64900,
                            "currency": "inr",
                            "receipt_email": "abdulquadir@sharklasers.com",
                            "description": "Netflix Subscription",
                            "metadata": {
                                "user_id": "user-uuid-1234",
                                "merchant": "Netflix India"
                            }
                        }
                    }
                }
                """;

        UnifiedPaymentEvent event = stripeAdapter.parsePayload(payload.getBytes(StandardCharsets.UTF_8), Map.of());

        assertEquals(649.0, event.getAmount(), "64900 paise should normalize to ₹649.00");
        assertEquals("Netflix India", event.getMerchantOrPayer());
        assertEquals(TransactionDirection.OUTGOING_DEBIT, event.getDirection());

        paymentWebhookService.processPaymentEvent(event);

        ArgumentCaptor<Debit> debitCaptor = ArgumentCaptor.forClass(Debit.class);
        verify(debitRepository).save(debitCaptor.capture());
        Debit savedDebit = debitCaptor.getValue();

        assertEquals(649.0, savedDebit.getAmount());
        assertEquals("Entertainment", savedDebit.getPaymentMethod(), "Should be categorized as Entertainment");
        assertEquals("abdulquadir@sharklasers.com", savedDebit.getEmail());
    }

    @Test
    @DisplayName("10. Rejects zero or negative amounts")
    void testZeroOrNegativeAmountRejected() {
        UnifiedPaymentEvent zeroEvent = new UnifiedPaymentEvent(
                "generic", "evt_zero", "payment.test",
                "user-uuid-1234", "abdulquadir@sharklasers.com",
                0.0, "INR", TransactionDirection.INCOMING_CREDIT,
                "Test", "Zero amount", "0"
        );

        WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(zeroEvent);
        assertFalse(result.isSuccess());
        verify(creditRepository, never()).save(any());
    }

    @Test
    @DisplayName("11. User resolution falls back to email when userId is absent")
    void testUserResolutionByUserIdAndEmailFallback() {
        UnifiedPaymentEvent eventWithEmailOnly = new UnifiedPaymentEvent(
                "generic", "evt_email_only", "payment.test",
                null, "abdulquadir@sharklasers.com",
                300.0, "INR", TransactionDirection.INCOMING_CREDIT,
                "UPI Payment", "Test Email Fallback", "ref_1"
        );

        WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(eventWithEmailOnly);
        assertTrue(result.isSuccess());
        verify(userRepository).findByEmailIgnoreCase("abdulquadir@sharklasers.com");
    }

    @Test
    @DisplayName("12. Different providers with same event ID are treated independently")
    void testDifferentProviderSameEventId() {
        UnifiedPaymentEvent rzpEvent = new UnifiedPaymentEvent(
                "razorpay", "same_evt_100", "payment.captured",
                "user-uuid-1234", "abdulquadir@sharklasers.com",
                500.0, "INR", TransactionDirection.INCOMING_CREDIT,
                "Store A", "Note", "1"
        );

        UnifiedPaymentEvent stripeEvent = new UnifiedPaymentEvent(
                "stripe", "same_evt_100", "charge.succeeded",
                "user-uuid-1234", "abdulquadir@sharklasers.com",
                500.0, "INR", TransactionDirection.OUTGOING_DEBIT,
                "Store B", "Note", "2"
        );

        WebhookProcessingResult res1 = paymentWebhookService.processPaymentEvent(rzpEvent);
        WebhookProcessingResult res2 = paymentWebhookService.processPaymentEvent(stripeEvent);

        assertTrue(res1.isSuccess());
        assertTrue(res2.isSuccess());
        verify(webhookEventRepository, times(2)).saveAndFlush(any(WebhookEvent.class));
    }

    @Test
    @DisplayName("13. Missing merchant fallback sets standard description")
    void testMissingMerchantFallback() {
        UnifiedPaymentEvent event = new UnifiedPaymentEvent(
                "generic", "evt_no_merchant", "payment.test",
                "user-uuid-1234", "abdulquadir@sharklasers.com",
                100.0, "INR", TransactionDirection.INCOMING_CREDIT,
                null, null, "ref_none"
        );

        WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(event);
        assertTrue(result.isSuccess());
        verify(creditRepository).save(any(Credit.class));
    }

    @Test
    @DisplayName("14. Generic UPI adapter correctly parses custom payload")
    void testGenericUpiAdapterParsing() throws Exception {
        String payload = """
                {
                    "eventId": "upi_txn_778899",
                    "eventType": "upi.incoming",
                    "userId": "user-uuid-1234",
                    "amount": 1500.0,
                    "currency": "INR",
                    "direction": "INCOMING_CREDIT",
                    "merchant": "Rahul Sharma",
                    "description": "Freelance Web Consultation",
                    "referenceNumber": "UPI/778899/RAHUL"
                }
                """;

        UnifiedPaymentEvent event = genericAdapter.parsePayload(payload.getBytes(StandardCharsets.UTF_8), Map.of());
        assertEquals("upi_txn_778899", event.getEventId());
        assertEquals(1500.0, event.getAmount());
        assertEquals(TransactionDirection.INCOMING_CREDIT, event.getDirection());
        assertEquals("Rahul Sharma", event.getMerchantOrPayer());
    }

    @Test
    @DisplayName("15. Chronological ledger recalculation is triggered on successful transaction")
    void testChronologicalLedgerRecalculationOnWebhook() {
        UnifiedPaymentEvent event = new UnifiedPaymentEvent(
                "razorpay", "evt_recalc", "payment.captured",
                "user-uuid-1234", "abdulquadir@sharklasers.com",
                250.0, "INR", TransactionDirection.INCOMING_CREDIT,
                "Zomato Refund", "Refund", "ref_recalc"
        );

        WebhookProcessingResult result = paymentWebhookService.processPaymentEvent(event);
        assertTrue(result.isSuccess());
        assertEquals(5000.0, result.getUpdatedBalance());
        verify(userRepository).save(mockUser);
    }
}
