package com.fintrack.dto;

public class SupportRequests {

    public static class PublicSupportRequest {
        private String name;
        private String email;
        private String subject;
        private String message;

        public PublicSupportRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class UserSupportRequest {
        private String subject;
        private String category;
        private String priority;
        private String message;

        public UserSupportRequest() {}

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
