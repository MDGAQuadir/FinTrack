package com.fintrack.controllers;

import com.fintrack.dto.ApiResponse;
import com.fintrack.dto.StatementRequest;
import com.fintrack.service.EmailService;
import com.fintrack.service.PdfService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/statement")
public class StatementController {

    private static final Logger log = LoggerFactory.getLogger(StatementController.class);

    private final EmailService emailService;
    private final PdfService pdfService;

    public StatementController(EmailService emailService, PdfService pdfService) {
        this.emailService = emailService;
        this.pdfService = pdfService;
    }

    @PostMapping("/email")
    public ResponseEntity<ApiResponse> sendStatement(@RequestBody StatementRequest request) {
        if (request.getEmail() == null || request.getHtml() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Email and HTML content are required")
                    .build());
        }

        try {
            byte[] pdfBytes = pdfService.generatePdfFromHtml(request.getHtml());
            emailService.sendStatementEmail(
                    request.getEmail(),
                    pdfBytes,
                    request.getStartDate() != null ? request.getStartDate() : "N/A",
                    request.getEndDate() != null ? request.getEndDate() : "N/A"
            );

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Statement email request sent successfully.")
                    .build());
        } catch (Exception e) {
            log.error("Send Statement Controller Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to dispatch email statement: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping(value = "/download", produces = org.springframework.http.MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadStatement(@RequestBody StatementRequest request) {
        if (request.getHtml() == null || request.getHtml().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            byte[] pdfBytes = pdfService.generatePdfFromHtml(request.getHtml());
            String fileName = String.format("FinTrack-Statement-%s-to-%s.pdf",
                    request.getStartDate() != null ? request.getStartDate() : "period",
                    request.getEndDate() != null ? request.getEndDate() : "end");

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Download Statement Controller Error: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
