package com.fintrack.service;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Optional;

@Service
public class PaymentWebhookService {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookService.class);

    private final WebhookEventRepository webhookEventRepository;
    private final UserRepository userRepository;
    private final CreditRepository creditRepository;
    private final DebitRepository debitRepository;
    private final UnifiedRepository unifiedRepository;
    private final SmartCategorizerService categorizerService;
    private final LedgerRecalculationService recalculationService;

    public PaymentWebhookService(
            WebhookEventRepository webhookEventRepository,
            UserRepository userRepository,
            CreditRepository creditRepository,
            DebitRepository debitRepository,
            UnifiedRepository unifiedRepository,
            SmartCategorizerService categorizerService,
            LedgerRecalculationService recalculationService) {
        this.webhookEventRepository = webhookEventRepository;
        this.userRepository = userRepository;
        this.creditRepository = creditRepository;
        this.debitRepository = debitRepository;
        this.unifiedRepository = unifiedRepository;
        this.categorizerService = categorizerService;
        this.recalculationService = recalculationService;
    }

    public static class WebhookProcessingResult {
        private final boolean success;
        private final boolean duplicate;
        private final String message;
        private final Double updatedBalance;

        public WebhookProcessingResult(boolean success, boolean duplicate, String message, Double updatedBalance) {
            this.success = success;
            this.duplicate = duplicate;
            this.message = message;
            this.updatedBalance = updatedBalance;
        }

        public boolean isSuccess() { return success; }
        public boolean isDuplicate() { return duplicate; }
        public String getMessage() { return message; }
        public Double getUpdatedBalance() { return updatedBalance; }
    }

    @Transactional
    public WebhookProcessingResult processPaymentEvent(UnifiedPaymentEvent event) {
        if (event == null || event.getEventId() == null || event.getEventId().isBlank()) {
            return new WebhookProcessingResult(false, false, "Invalid webhook event: missing event ID", null);
        }

        if (event.getAmount() == null || event.getAmount() <= 0) {
            return new WebhookProcessingResult(false, false, "Invalid transaction: amount must be greater than zero", null);
        }

        // 1. Atomic Database-Level Idempotency Check
        try {
            WebhookEvent webhookEvent = new WebhookEvent(
                    event.getProvider(),
                    event.getEventId(),
                    event.getUserId(),
                    event.getEventType(),
                    event.getRawPayloadHash(),
                    "PROCESSED"
            );
            webhookEventRepository.saveAndFlush(webhookEvent);
        } catch (DataIntegrityViolationException ex) {
            log.info("⏩ Webhook event already processed [Provider: {}, EventId: {}]. Ignoring duplicate.",
                    event.getProvider(), event.getEventId());
            return new WebhookProcessingResult(true, true, "Duplicate event already processed (Idempotency Key Active)", null);
        }

        // 2. Resolve User (UUID first, Email fallback)
        User user = null;
        if (event.getUserId() != null && !event.getUserId().isBlank()) {
            user = userRepository.findById(event.getUserId().trim()).orElse(null);
        }
        if (user == null && event.getUserEmail() != null && !event.getUserEmail().isBlank()) {
            user = userRepository.findByEmailIgnoreCase(event.getUserEmail().trim().toLowerCase()).orElse(null);
        }

        if (user == null) {
            // If user cannot be matched, keep event logged in WebhookEvent table but return warning
            log.warn("⚠️ Webhook received but no user found matching ID '{}' or Email '{}'", event.getUserId(), event.getUserEmail());
            return new WebhookProcessingResult(false, false, "User account not found for webhook transaction", null);
        }

        Date now = event.getEventTimestamp() != null ? event.getEventTimestamp() : new Date();
        String dateStr = new SimpleDateFormat("yyyy-MM-dd").format(now);
        String category = categorizerService.categorize(
                event.getMerchantOrPayer() + " " + (event.getDescription() != null ? event.getDescription() : ""),
                event.getDirection() == TransactionDirection.INCOMING_CREDIT ? "CREDIT" : "DEBIT"
        );

        String paymentSource = String.format("%s Webhook (%s)",
                capitalize(event.getProvider()),
                event.getReferenceNumber() != null ? event.getReferenceNumber() : event.getEventId());

        if (event.getDirection() == TransactionDirection.INCOMING_CREDIT) {
            // Create Credit
            Credit credit = new Credit();
            credit.setEmail(user.getEmail());
            credit.setDate(dateStr);
            credit.setAmount(event.getAmount());
            credit.setCreditedFrom(event.getMerchantOrPayer() != null ? event.getMerchantOrPayer() : "Payment Received");
            credit.setPurpose(category);
            credit.setSourceOfPayment(paymentSource);
            credit.setNote(event.getDescription() != null ? event.getDescription() : "Automated webhook credit");
            credit.setCreatedAt(now);
            credit.setUpdatedAt(now);
            creditRepository.save(credit);

            Unified u = new Unified();
            u.setEmail(user.getEmail());
            u.setDate(dateStr);
            u.setCredit(event.getAmount());
            u.setDebit(0.0);
            u.setPurpose(category);
            u.setSourceOfPayment(paymentSource);
            u.setBalance(user.getBalance() != null ? user.getBalance() : 0.0);
            u.setCreatedAt(now);
            u.setUpdatedAt(now);
            unifiedRepository.save(u);
        } else {
            // Create Debit
            Debit debit = new Debit();
            debit.setEmail(user.getEmail());
            debit.setDate(dateStr);
            debit.setAmount(event.getAmount());
            debit.setPaidTo(event.getMerchantOrPayer() != null ? event.getMerchantOrPayer() : "Payment Made");
            debit.setPaymentMethod(category);
            debit.setNote(event.getDescription() != null ? event.getDescription() : "Automated webhook debit");
            debit.setCreatedAt(now);
            debit.setUpdatedAt(now);
            debitRepository.save(debit);

            Unified u = new Unified();
            u.setEmail(user.getEmail());
            u.setDate(dateStr);
            u.setDebit(event.getAmount());
            u.setCredit(0.0);
            u.setPurpose(category);
            u.setSourceOfPayment(paymentSource);
            u.setBalance(user.getBalance() != null ? user.getBalance() : 0.0);
            u.setCreatedAt(now);
            u.setUpdatedAt(now);
            unifiedRepository.save(u);
        }

        // 3. Chronological timeline recalculation & user balance update
        double newBalance = recalculationService.recalculateTimelineAndSave(user);
        log.info("⚡ [Webhook Pipeline] Successfully recorded {} of ₹{} for user {}. New running balance: ₹{}",
                event.getDirection(), event.getAmount(), user.getEmail(), newBalance);

        return new WebhookProcessingResult(
                true,
                false,
                String.format("Payment event processed successfully! Running balance: ₹%.2f", newBalance),
                newBalance
        );
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "Payment";
        return Character.toUpperCase(str.charAt(0)) + str.substring(1).toLowerCase();
    }
}
