package com.fintrack.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "unifieds")
public class Unified {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JsonProperty("_id")
    private String id;

    @Column(name = "email", nullable = false)
    @JsonProperty("Email")
    private String email;

    @Column(name = "date")
    @JsonProperty("Date")
    private String date;

    @Column(name = "source_of_payment")
    @JsonProperty("Source of Payment")
    private String sourceOfPayment;

    @Column(name = "purpose")
    @JsonProperty("Purpose")
    private String purpose;

    @Column(name = "debit")
    @JsonProperty("Debit")
    private Double debit = 0.0;

    @Column(name = "credit")
    @JsonProperty("Credit")
    private Double credit = 0.0;

    @Column(name = "balance")
    @JsonProperty("Balance")
    private Double balance;

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

    public Unified() {}

    public Unified(String id, String email, String date, String sourceOfPayment, String purpose,
                   Double debit, Double credit, Double balance, Date createdAt, Date updatedAt) {
        this.id = id;
        this.email = email;
        this.date = date;
        this.sourceOfPayment = sourceOfPayment;
        this.purpose = purpose;
        this.debit = debit != null ? debit : 0.0;
        this.credit = credit != null ? credit : 0.0;
        this.balance = balance;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getSourceOfPayment() { return sourceOfPayment; }
    public void setSourceOfPayment(String sourceOfPayment) { this.sourceOfPayment = sourceOfPayment; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Double getDebit() { return debit; }
    public void setDebit(Double debit) { this.debit = debit; }

    public Double getCredit() { return credit; }
    public void setCredit(Double credit) { this.credit = credit; }

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
