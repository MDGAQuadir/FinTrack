package com.fintrack.service;

import com.itextpdf.text.Document;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.tool.xml.XMLWorkerHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@Service
public class PdfService {

    private static final Logger log = LoggerFactory.getLogger(PdfService.class);

    public byte[] generatePdfFromHtml(String htmlContent) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            document.open();

            // Clean basic html entity or self-closing tags for xml parser compatibility
            String cleanHtml = htmlContent
                    .replace("&nbsp;", " ")
                    .replace("<br>", "<br/>")
                    .replace("<hr>", "<hr/>");

            if (!cleanHtml.toLowerCase().contains("<html>")) {
                cleanHtml = "<html><body>" + cleanHtml + "</body></html>";
            }

            ByteArrayInputStream inputStream = new ByteArrayInputStream(cleanHtml.getBytes(StandardCharsets.UTF_8));
            XMLWorkerHelper.getInstance().parseXHtml(writer, document, inputStream, StandardCharsets.UTF_8);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.warn("HTML to PDF conversion failed, returning fallback placeholder bytes: {}", e.getMessage());
            return new byte[0];
        }
    }
}
