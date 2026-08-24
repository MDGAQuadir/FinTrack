package com.fintrack.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${fintrack.development-mode:true}")
    private boolean devMode;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isSmtpConfigured() {
        return fromEmail != null && !fromEmail.isBlank();
    }

    public void sendOtpEmail(String toEmail, String otp) {
        if (!isSmtpConfigured()) {
            if (devMode) {
                log.info("📧 [FinTrack Dev Security] SMTP unconfigured. Generated OTP for development login: {}", otp);
            } else {
                log.warn("⚠️ [FinTrack Security] SMTP credentials unconfigured (MAIL_USERNAME/MAIL_PASSWORD). Cannot dispatch OTP to {}", toEmail);
            }
            return;
        }

        try {
            log.info("📧 [FinTrack Security] Dispatching live OTP email to {}", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[FinTrack] Your One-Time Passcode (OTP)");

            String html = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-bottom: 16px;">FinTrack Security</h2>
                    <p style="font-size: 15px; color: #3f3f46;">Use the following 6-digit one-time code to sign in to your FinTrack Workspace:</p>
                    <div style="background-color: #f4f4f5; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #18181b;">%s</span>
                    </div>
                    <p style="font-size: 13px; color: #71717a;">This verification code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            """, otp);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Live OTP email dispatched successfully to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendSupportEmail(String toEmail, String fromEmailAddress, String fromName, String subject, String htmlBody) {
        if (!isSmtpConfigured()) {
            log.info("📨 [FinTrack Support] SMTP unconfigured. Support ticket from '{}' <{}>: {}", fromName, fromEmailAddress, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setReplyTo(fromEmailAddress);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("✅ Support email dispatched successfully to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send support email: {}", e.getMessage());
        }
    }

    public void sendStatementEmail(String toEmail, byte[] pdfAttachment, String startDate, String endDate) {
        if (!isSmtpConfigured()) {
            log.info("📊 [FinTrack Statement] SMTP unconfigured. Statement generated for {} ({} to {}). PDF bytes: {}",
                    toEmail, startDate, endDate, pdfAttachment != null ? pdfAttachment.length : 0);
            return;
        }

        try {
            log.info("📊 [FinTrack Statement] Dispatching financial statement to {} for period {} to {}", toEmail, startDate, endDate);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(String.format("FinTrack Statement of Account (%s - %s)", startDate, endDate));

            String html = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-bottom: 16px;">FinTrack Account Statement</h2>
                    <p style="font-size: 15px; color: #3f3f46;">Please find attached your official financial statement generated from FinTrack for the period <strong>%s to %s</strong>.</p>
                    <p style="font-size: 13px; color: #71717a; margin-top: 24px;">Generated automatically by FinTrack Personal Finance Manager.</p>
                </div>
            """, startDate, endDate);

            helper.setText(html, true);

            if (pdfAttachment != null && pdfAttachment.length > 0) {
                String filename = String.format("FinTrack-Statement-%s-to-%s.pdf", startDate, endDate);
                helper.addAttachment(filename, new ByteArrayResource(pdfAttachment));
            }

            mailSender.send(message);
            log.info("✅ Live Statement PDF email dispatched successfully to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send statement email: {}", e.getMessage());
        }
    }
}
