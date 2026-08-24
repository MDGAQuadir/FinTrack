package com.fintrack.dto;

import java.util.Date;

public class UnifiedPaymentEvent {

    public enum TransactionDirection {
        INCOMING_CREDIT,
        OUTGOING_DEBIT
    }

    private String provider;
    private String eventId;
    private String eventType;
    private String userId;
    private String userEmail;
    private Double amount;
    private String currency;
    private TransactionDirection direction;
    private String merchantOrPayer;
    private String description;
    private String referenceNumber;
    private Date eventTimestamp;
    private String rawPayloadHash;

    public UnifiedPaymentEvent() {
        this.currency = "INR";
        this.eventTimestamp = new Date();
    }

    public UnifiedPaymentEvent(String provider, String eventId, String eventType, String userId, String userEmail,
                               Double amount, String currency, TransactionDirection direction,
                               String merchantOrPayer, String description, String referenceNumber) {
        this.provider = provider;
        this.eventId = eventId;
        this.eventType = eventType;
        this.userId = userId;
        this.userEmail = userEmail;
        this.amount = amount;
        this.currency = currency != null ? currency : "INR";
        this.direction = direction;
        this.merchantOrPayer = merchantOrPayer;
        this.description = description;
        this.referenceNumber = referenceNumber;
        this.eventTimestamp = new Date();
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public TransactionDirection getDirection() { return direction; }
    public void setDirection(TransactionDirection direction) { this.direction = direction; }

    public String getMerchantOrPayer() { return merchantOrPayer; }
    public void setMerchantOrPayer(String merchantOrPayer) { this.merchantOrPayer = merchantOrPayer; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public Date getEventTimestamp() { return eventTimestamp; }
    public void setEventTimestamp(Date eventTimestamp) { this.eventTimestamp = eventTimestamp; }

    public String getRawPayloadHash() { return rawPayloadHash; }
    public void setRawPayloadHash(String rawPayloadHash) { this.rawPayloadHash = rawPayloadHash; }
}
