package com.fintrack.models;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "webhook_events", uniqueConstraints = {
    @UniqueConstraint(name = "uk_webhook_provider_event", columnNames = {"provider", "event_id"})
})
public class WebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "provider", nullable = false)
    private String provider;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "payload_hash")
    private String payloadHash;

    @Column(name = "status")
    private String status; // PROCESSED, DUPLICATE_IGNORED, FAILED

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "processed_at", nullable = false)
    private Date processedAt;

    public WebhookEvent() {}

    public WebhookEvent(String provider, String eventId, String userId, String eventType, String payloadHash, String status) {
        this.provider = provider;
        this.eventId = eventId;
        this.userId = userId;
        this.eventType = eventType;
        this.payloadHash = payloadHash;
        this.status = status;
        this.processedAt = new Date();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getPayloadHash() { return payloadHash; }
    public void setPayloadHash(String payloadHash) { this.payloadHash = payloadHash; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getProcessedAt() { return processedAt; }
    public void setProcessedAt(Date processedAt) { this.processedAt = processedAt; }
}
