package com.fintrack.dto;

import java.util.List;

public class StatementImportDto {

    public static class ParsedTransactionDto {
        private String id;
        private String date;              // YYYY-MM-DD
        private String description;
        private Double amount;
        private String type;              // "DEBIT" or "CREDIT"
        private String category;
        private String referenceNumber;
        private Double balance;
        private Boolean isDuplicate;
        private String duplicateReason;
        private Boolean selected;

        public ParsedTransactionDto() {}

        public ParsedTransactionDto(String id, String date, String description, Double amount, String type, String category, String referenceNumber, Double balance, Boolean isDuplicate, String duplicateReason, Boolean selected) {
            this.id = id;
            this.date = date;
            this.description = description;
            this.amount = amount;
            this.type = type;
            this.category = category;
            this.referenceNumber = referenceNumber;
            this.balance = balance;
            this.isDuplicate = isDuplicate;
            this.duplicateReason = duplicateReason;
            this.selected = selected;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

        public Double getBalance() { return balance; }
        public void setBalance(Double balance) { this.balance = balance; }

        public Boolean getIsDuplicate() { return isDuplicate; }
        public void setIsDuplicate(Boolean isDuplicate) { this.isDuplicate = isDuplicate; }

        public String getDuplicateReason() { return duplicateReason; }
        public void setDuplicateReason(String duplicateReason) { this.duplicateReason = duplicateReason; }

        public Boolean getSelected() { return selected; }
        public void setSelected(Boolean selected) { this.selected = selected; }
    }

    public static class StatementImportPreviewResponse {
        private boolean success;
        private String message;
        private String filename;
        private String detectedFormat;
        private int totalParsed;
        private int totalDebits;
        private int totalCredits;
        private int duplicatesCount;
        private double inflowAmount;
        private double outflowAmount;
        private List<ParsedTransactionDto> transactions;

        public StatementImportPreviewResponse() {}

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }

        public String getDetectedFormat() { return detectedFormat; }
        public void setDetectedFormat(String detectedFormat) { this.detectedFormat = detectedFormat; }

        public int getTotalParsed() { return totalParsed; }
        public void setTotalParsed(int totalParsed) { this.totalParsed = totalParsed; }

        public int getTotalDebits() { return totalDebits; }
        public void setTotalDebits(int totalDebits) { this.totalDebits = totalDebits; }

        public int getTotalCredits() { return totalCredits; }
        public void setTotalCredits(int totalCredits) { this.totalCredits = totalCredits; }

        public int getDuplicatesCount() { return duplicatesCount; }
        public void setDuplicatesCount(int duplicatesCount) { this.duplicatesCount = duplicatesCount; }

        public double getInflowAmount() { return inflowAmount; }
        public void setInflowAmount(double inflowAmount) { this.inflowAmount = inflowAmount; }

        public double getOutflowAmount() { return outflowAmount; }
        public void setOutflowAmount(double outflowAmount) { this.outflowAmount = outflowAmount; }

        public List<ParsedTransactionDto> getTransactions() { return transactions; }
        public void setTransactions(List<ParsedTransactionDto> transactions) { this.transactions = transactions; }
    }

    public static class StatementImportCommitRequest {
        private List<ParsedTransactionDto> transactions;

        public StatementImportCommitRequest() {}

        public List<ParsedTransactionDto> getTransactions() { return transactions; }
        public void setTransactions(List<ParsedTransactionDto> transactions) { this.transactions = transactions; }
    }

    public static class StatementImportCommitResponse {
        private boolean success;
        private String message;
        private int importedCount;
        private double newBalance;

        public StatementImportCommitResponse() {}

        public StatementImportCommitResponse(boolean success, String message, int importedCount, double newBalance) {
            this.success = success;
            this.message = message;
            this.importedCount = importedCount;
            this.newBalance = newBalance;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public int getImportedCount() { return importedCount; }
        public void setImportedCount(int importedCount) { this.importedCount = importedCount; }

        public double getNewBalance() { return newBalance; }
        public void setNewBalance(double newBalance) { this.newBalance = newBalance; }
    }
}
