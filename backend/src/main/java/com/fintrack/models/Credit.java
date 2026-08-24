package com.fintrack.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "credits")
public class Credit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JsonProperty("_id")
    private String id;

    @Column(name = "email", nullable = false)
    @JsonProperty("Email")
    private String email;

    @Column(name = "amount")
    @JsonProperty("Amount")
    private Double amount;

    @Column(name = "purpose")
    @JsonProperty("Purpose")
    private String purpose;

    @Column(name = "credited_from")
    @JsonProperty("Credited From")
    private String creditedFrom;

    @Column(name = "date")
    @JsonProperty("Date")
    private String date;

    @Column(name = "source_of_payment")
    @JsonProperty("Source of Payment")
    private String sourceOfPayment;

    @Column(name = "note", length = 1000)
    @JsonProperty("Note")
    private String note;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    @JsonProperty("createdAt")
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    @JsonProperty("updatedAt")
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Date();
    }

    public Credit() {}

    public Credit(String id, String email, Double amount, String purpose, String creditedFrom,
                  String date, String sourceOfPayment, String note, Date createdAt, Date updatedAt) {
        this.id = id;
        this.email = email;
        this.amount = amount;
        this.purpose = purpose;
        this.creditedFrom = creditedFrom;
        this.date = date;
        this.sourceOfPayment = sourceOfPayment;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getCreditedFrom() { return creditedFrom; }
    public void setCreditedFrom(String creditedFrom) { this.creditedFrom = creditedFrom; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getSourceOfPayment() { return sourceOfPayment; }
    public void setSourceOfPayment(String sourceOfPayment) { this.sourceOfPayment = sourceOfPayment; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
