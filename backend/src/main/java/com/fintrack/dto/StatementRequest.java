package com.fintrack.dto;

public class StatementRequest {
    private String email;
    private String html;
    private String startDate;
    private String endDate;

    public StatementRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHtml() { return html; }
    public void setHtml(String html) { this.html = html; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}
