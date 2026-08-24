package com.fintrack.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {
    private boolean success;
    private String message;
    private Boolean exists;
    private String otp;
    private Object user;
    private String token;
    private Double balance;
    private Object results;

    public ApiResponse() {}

    public ApiResponse(boolean success, String message, Boolean exists, String otp,
                       Object user, String token, Double balance, Object results) {
        this.success = success;
        this.message = message;
        this.exists = exists;
        this.otp = otp;
        this.user = user;
        this.token = token;
        this.balance = balance;
        this.results = results;
    }

    public static ApiResponseBuilder builder() {
        return new ApiResponseBuilder();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Boolean getExists() { return exists; }
    public void setExists(Boolean exists) { this.exists = exists; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public Object getUser() { return user; }
    public void setUser(Object user) { this.user = user; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public Object getResults() { return results; }
    public void setResults(Object results) { this.results = results; }

    public static class ApiResponseBuilder {
        private boolean success;
        private String message;
        private Boolean exists;
        private String otp;
        private Object user;
        private String token;
        private Double balance;
        private Object results;

        public ApiResponseBuilder success(boolean success) { this.success = success; return this; }
        public ApiResponseBuilder message(String message) { this.message = message; return this; }
        public ApiResponseBuilder exists(Boolean exists) { this.exists = exists; return this; }
        public ApiResponseBuilder otp(String otp) { this.otp = otp; return this; }
        public ApiResponseBuilder user(Object user) { this.user = user; return this; }
        public ApiResponseBuilder token(String token) { this.token = token; return this; }
        public ApiResponseBuilder balance(Double balance) { this.balance = balance; return this; }
        public ApiResponseBuilder results(Object results) { this.results = results; return this; }

        public ApiResponse build() {
            return new ApiResponse(success, message, exists, otp, user, token, balance, results);
        }
    }
}
