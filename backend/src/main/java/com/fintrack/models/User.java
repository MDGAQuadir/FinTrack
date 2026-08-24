package com.fintrack.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JsonProperty("_id")
    private String id;

    @Column(name = "email", unique = true, nullable = false)
    @JsonProperty("Email")
    private String email;

    @Column(name = "name")
    @JsonProperty("Name")
    private String name;

    @Column(name = "phone")
    @JsonProperty("Phone")
    private String phone;

    @Column(name = "occupation")
    @JsonProperty("Occupation")
    private String occupation;

    @Column(name = "city")
    @JsonProperty("City")
    private String city;

    @Column(name = "address")
    @JsonProperty("Address")
    private String address;

    @Column(name = "zipcode")
    @JsonProperty("Zipcode")
    private String zipcode;

    @Column(name = "state")
    @JsonProperty("State")
    private String state;

    @Column(name = "country")
    @JsonProperty("Country")
    private String country;

    @Column(name = "balance")
    @JsonProperty("Balance")
    private Double balance;

    @Column(name = "initial_balance")
    @JsonProperty("InitialBalance")
    private Double initialBalance;

    @Column(name = "otp")
    @JsonProperty("OTP")
    private String otp;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "otp_expires")
    @JsonProperty("OTPExpires")
    private Date otpExpires;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_login_request")
    @JsonProperty("LastLoginRequest")
    private Date lastLoginRequest;

    @Version
    @Column(name = "version")
    private Long version;

    public User() {}

    public User(String id, String email, String name, String phone, String occupation,
                String city, String address, String zipcode, String state, String country,
                Double balance, String otp, Date otpExpires, Date lastLoginRequest) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.occupation = occupation;
        this.city = city;
        this.address = address;
        this.zipcode = zipcode;
        this.state = state;
        this.country = country;
        this.balance = balance;
        this.otp = otp;
        this.otpExpires = otpExpires;
        this.lastLoginRequest = lastLoginRequest;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

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

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public Double getInitialBalance() { return initialBalance != null ? initialBalance : (balance != null ? balance : 0.0); }
    public void setInitialBalance(Double initialBalance) { this.initialBalance = initialBalance; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public Date getOtpExpires() { return otpExpires; }
    public void setOtpExpires(Date otpExpires) { this.otpExpires = otpExpires; }

    public Date getLastLoginRequest() { return lastLoginRequest; }
    public void setLastLoginRequest(Date lastLoginRequest) { this.lastLoginRequest = lastLoginRequest; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
