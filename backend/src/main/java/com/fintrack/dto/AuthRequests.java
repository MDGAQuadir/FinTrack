package com.fintrack.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthRequests {

    public static class CheckEmailRequest {
        private String email;
        @JsonProperty("Email")
        private String capitalEmail;

        public CheckEmailRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCapitalEmail() { return capitalEmail; }
        public void setCapitalEmail(String capitalEmail) { this.capitalEmail = capitalEmail; }

        public String getResolvedEmail() {
            return email != null && !email.isBlank() ? email : capitalEmail;
        }
    }

    public static class RegisterRequest {
        private String email;
        @JsonProperty("Email")
        private String capitalEmail;

        private String name;
        @JsonProperty("Name")
        private String capitalName;

        private String phone;
        @JsonProperty("Phone")
        private String capitalPhone;

        private String occupation;
        @JsonProperty("Occupation")
        private String capitalOccupation;

        private String city;
        @JsonProperty("City")
        private String capitalCity;

        public RegisterRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCapitalEmail() { return capitalEmail; }
        public void setCapitalEmail(String capitalEmail) { this.capitalEmail = capitalEmail; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCapitalName() { return capitalName; }
        public void setCapitalName(String capitalName) { this.capitalName = capitalName; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getCapitalPhone() { return capitalPhone; }
        public void setCapitalPhone(String capitalPhone) { this.capitalPhone = capitalPhone; }

        public String getOccupation() { return occupation; }
        public void setOccupation(String occupation) { this.occupation = occupation; }
        public String getCapitalOccupation() { return capitalOccupation; }
        public void setCapitalOccupation(String capitalOccupation) { this.capitalOccupation = capitalOccupation; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getCapitalCity() { return capitalCity; }
        public void setCapitalCity(String capitalCity) { this.capitalCity = capitalCity; }

        public String getResolvedEmail() {
            return email != null && !email.isBlank() ? email : capitalEmail;
        }
        public String getResolvedName() {
            return name != null ? name : capitalName;
        }
        public String getResolvedPhone() {
            return phone != null ? phone : capitalPhone;
        }
        public String getResolvedOccupation() {
            return occupation != null ? occupation : capitalOccupation;
        }
        public String getResolvedCity() {
            return city != null ? city : capitalCity;
        }
    }

    public static class VerifyOtpRequest {
        private String email;
        @JsonProperty("Email")
        private String capitalEmail;

        private String otp;
        @JsonProperty("OTP")
        private String capitalOtp;

        public VerifyOtpRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCapitalEmail() { return capitalEmail; }
        public void setCapitalEmail(String capitalEmail) { this.capitalEmail = capitalEmail; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
        public String getCapitalOtp() { return capitalOtp; }
        public void setCapitalOtp(String capitalOtp) { this.capitalOtp = capitalOtp; }

        public String getResolvedEmail() {
            return email != null && !email.isBlank() ? email : capitalEmail;
        }
        public String getResolvedOtp() {
            return otp != null && !otp.isBlank() ? otp : capitalOtp;
        }
    }

    public static class UpdateBalanceRequest {
        private String userRowId;
        private Double balance;

        public UpdateBalanceRequest() {}

        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public Double getBalance() { return balance; }
        public void setBalance(Double balance) { this.balance = balance; }
    }

    public static class UpdateProfileRequest {
        private String userRowId;
        @JsonProperty("Name")
        private String name;
        @JsonProperty("Phone")
        private String phone;
        @JsonProperty("Occupation")
        private String occupation;
        @JsonProperty("City")
        private String city;
        @JsonProperty("Address")
        private String address;
        @JsonProperty("Zipcode")
        private String zipcode;
        @JsonProperty("State")
        private String state;
        @JsonProperty("Country")
        private String country;

        public UpdateProfileRequest() {}

        public String getUserRowId() { return userRowId; }
        public void setUserRowId(String userRowId) { this.userRowId = userRowId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getOccupation() { return occupation; }
        public void setOccupation(String occupation) { this.occupation = occupation; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getZipcode() { return zipcode; }
        public void setZipcode(String zipcode) { this.zipcode = zipcode; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
    }
}
