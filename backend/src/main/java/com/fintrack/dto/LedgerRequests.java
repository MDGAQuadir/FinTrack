package com.fintrack.dto;

public class LedgerRequests {

    public static class GetLedgerRequest {
        private String email;

        public GetLedgerRequest() {}
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class AddCreditRequest {
        private String email;
        private String userRowId;
        private Double currentBalance;
        private Double amount;
        private String purpose;
        private String creditedFrom;
        private String sourceOfPayment;
        private String note;
        private String date;

        public AddCreditRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public Double getCurrentBalance() { return currentBalance; }
        public void setCurrentBalance(Double currentBalance) { this.currentBalance = currentBalance; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        public String getCreditedFrom() { return creditedFrom; }
        public void setCreditedFrom(String creditedFrom) { this.creditedFrom = creditedFrom; }
        public String getSourceOfPayment() { return sourceOfPayment; }
        public void setSourceOfPayment(String sourceOfPayment) { this.sourceOfPayment = sourceOfPayment; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }

    public static class AddDebitRequest {
        private String email;
        private String userRowId;
        private Double currentBalance;
        private Double amount;
        private String paymentMethod;
        private String paidTo;
        private String note;
        private String date;

        public AddDebitRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public Double getCurrentBalance() { return currentBalance; }
        public void setCurrentBalance(Double currentBalance) { this.currentBalance = currentBalance; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getPaidTo() { return paidTo; }
        public void setPaidTo(String paidTo) { this.paidTo = paidTo; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }

    public static class DeleteCreditRequest {
        private String email;
        private String userRowId;
        private String creditRowId;
        private Double amount;
        private String purpose;
        private String date;

        public DeleteCreditRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public String getCreditRowId() { return creditRowId; }
        public void setCreditRowId(String creditRowId) { this.creditRowId = creditRowId; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }

    public static class DeleteDebitRequest {
        private String email;
        private String userRowId;
        private String debitRowId;
        private Double amount;
        private String purpose;
        private String date;

        public DeleteDebitRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public String getDebitRowId() { return debitRowId; }
        public void setDebitRowId(String debitRowId) { this.debitRowId = debitRowId; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }

    public static class UpdateCreditRequest {
        private String email;
        private String userRowId;
        private String creditRowId;
        private Double oldAmount;
        private Double newAmount;
        private String oldPurpose;
        private String newPurpose;
        private String oldDate;
        private String newDate;
        private String creditedFrom;
        private String sourceOfPayment;
        private String note;

        public UpdateCreditRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public String getCreditRowId() { return creditRowId; }
        public void setCreditRowId(String creditRowId) { this.creditRowId = creditRowId; }
        public Double getOldAmount() { return oldAmount; }
        public void setOldAmount(Double oldAmount) { this.oldAmount = oldAmount; }
        public Double getNewAmount() { return newAmount; }
        public void setNewAmount(Double newAmount) { this.newAmount = newAmount; }
        public String getOldPurpose() { return oldPurpose; }
        public void setOldPurpose(String oldPurpose) { this.oldPurpose = oldPurpose; }
        public String getNewPurpose() { return newPurpose; }
        public void setNewPurpose(String newPurpose) { this.newPurpose = newPurpose; }
        public String getOldDate() { return oldDate; }
        public void setOldDate(String oldDate) { this.oldDate = oldDate; }
        public String getNewDate() { return newDate; }
        public void setNewDate(String newDate) { this.newDate = newDate; }
        public String getCreditedFrom() { return creditedFrom; }
        public void setCreditedFrom(String creditedFrom) { this.creditedFrom = creditedFrom; }
        public String getSourceOfPayment() { return sourceOfPayment; }
        public void setSourceOfPayment(String sourceOfPayment) { this.sourceOfPayment = sourceOfPayment; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class UpdateDebitRequest {
        private String email;
        private String userRowId;
        private String debitRowId;
        private Double oldAmount;
        private Double newAmount;
        private String oldPurpose;
        private String newPurpose;
        private String oldDate;
        private String newDate;
        private String paidTo;
        private String paymentMethod;
        private String note;

        public UpdateDebitRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public String getDebitRowId() { return debitRowId; }
        public void setDebitRowId(String debitRowId) { this.debitRowId = debitRowId; }
        public Double getOldAmount() { return oldAmount; }
        public void setOldAmount(Double oldAmount) { this.oldAmount = oldAmount; }
        public Double getNewAmount() { return newAmount; }
        public void setNewAmount(Double newAmount) { this.newAmount = newAmount; }
        public String getOldPurpose() { return oldPurpose; }
        public void setOldPurpose(String oldPurpose) { this.oldPurpose = oldPurpose; }
        public String getNewPurpose() { return newPurpose; }
        public void setNewPurpose(String newPurpose) { this.newPurpose = newPurpose; }
        public String getOldDate() { return oldDate; }
        public void setOldDate(String oldDate) { this.oldDate = oldDate; }
        public String getNewDate() { return newDate; }
        public void setNewDate(String newDate) { this.newDate = newDate; }
        public String getPaidTo() { return paidTo; }
        public void setPaidTo(String paidTo) { this.paidTo = paidTo; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }
}
