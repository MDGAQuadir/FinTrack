package com.fintrack.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "debits")
public class Debit {

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

    @Column(name = "payment_method")
    @JsonProperty("Payment Method")
    private String paymentMethod;

    @Column(name = "paid_to")
    @JsonProperty("Paid to")
    private String paidTo;

    @Column(name = "date")
    @JsonProperty("Date")
    private String date;

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

    public Debit() {}

    public Debit(String id, String email, Double amount, String paymentMethod, String paidTo,
                 String date, String note, Date createdAt, Date updatedAt) {
        this.id = id;
        this.email = email;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paidTo = paidTo;
        this.date = date;
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

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaidTo() { return paidTo; }
    public void setPaidTo(String paidTo) { this.paidTo = paidTo; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
