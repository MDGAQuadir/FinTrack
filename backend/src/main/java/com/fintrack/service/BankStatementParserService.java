package com.fintrack.service;

import com.fintrack.dto.StatementImportDto.ParsedTransactionDto;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BankStatementParserService {

    private static final Logger log = LoggerFactory.getLogger(BankStatementParserService.class);
    private final SmartCategorizerService categorizerService;

    public BankStatementParserService(SmartCategorizerService categorizerService) {
        this.categorizerService = categorizerService;
    }

    public List<ParsedTransactionDto> parseFile(MultipartFile file, String[] detectedFormatHolder) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "statement";
        String lowerName = filename.toLowerCase(Locale.ROOT);

        if (lowerName.endsWith(".csv") || lowerName.endsWith(".txt")) {
            detectedFormatHolder[0] = "CSV / Delimited Table";
            return parseCsv(file);
        } else if (lowerName.endsWith(".pdf")) {
            detectedFormatHolder[0] = "PDF Bank Statement";
            return parsePdf(file);
        } else {
            // Default to CSV
            detectedFormatHolder[0] = "Auto-detected CSV";
            return parseCsv(file);
        }
    }

    // -------------------------------------------------------------
    // CSV Parser
    // -------------------------------------------------------------
    public List<ParsedTransactionDto> parseCsv(MultipartFile file) throws Exception {
        List<ParsedTransactionDto> result = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            List<String> lines = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    lines.add(line);
                }
            }

            if (lines.isEmpty()) {
                return result;
            }

            // Detect delimiter
            char delimiter = detectDelimiter(lines);

            // Find header line index
            int headerIndex = findHeaderIndex(lines, delimiter);
            if (headerIndex == -1) headerIndex = 0;

            String joined = String.join("\n", lines.subList(headerIndex, lines.size()));
            CSVFormat format = CSVFormat.Builder.create()
                    .setDelimiter(delimiter)
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .setIgnoreSurroundingSpaces(true)
                    .setAllowMissingColumnNames(true)
                    .build();

            try (CSVParser parser = CSVParser.parse(joined, format)) {
                Map<String, Integer> headerMap = parser.getHeaderMap();
                if (headerMap == null || headerMap.isEmpty()) {
                    return parsePositional(lines, delimiter);
                }

                String dateCol = findColumn(headerMap, "date", "txn date", "value date", "transaction date", "booking date");
                String descCol = findColumn(headerMap, "narration", "description", "particulars", "remarks", "details", "transaction details", "payee", "note");
                String debitCol = findColumn(headerMap, "debit", "withdrawal", "dr", "debit amount", "withdrawal amount", "withdrawals");
                String creditCol = findColumn(headerMap, "credit", "deposit", "cr", "credit amount", "deposit amount", "deposits");
                String amountCol = findColumn(headerMap, "amount", "transaction amount", "txn amount", "net amount");
                String typeCol = findColumn(headerMap, "type", "cr/dr", "txn type", "d/c");
                String refCol = findColumn(headerMap, "ref", "reference", "chq", "cheque", "utr", "transaction id", "ref no", "txn id");
                String balCol = findColumn(headerMap, "balance", "closing balance", "running balance");

                for (CSVRecord record : parser) {
                    try {
                        String rawDate = getColValue(record, dateCol);
                        String normalizedDate = normalizeDate(rawDate);
                        if (normalizedDate == null) continue; // Not a valid date row

                        String rawDesc = getColValue(record, descCol);
                        if (rawDesc == null || rawDesc.isBlank()) {
                            rawDesc = "Bank Transaction";
                        }

                        // Skip summary or metadata lines
                        if (isMetadataOrSummaryRow(rawDesc)) {
                            continue;
                        }

                        Double debitAmt = parseAmount(getColValue(record, debitCol));
                        Double creditAmt = parseAmount(getColValue(record, creditCol));
                        Double generalAmt = parseAmount(getColValue(record, amountCol));
                        String typeStr = getColValue(record, typeCol);
                        String ref = getColValue(record, refCol);
                        Double balance = parseAmount(getColValue(record, balCol));

                        String type = "DEBIT";
                        Double finalAmount = 0.0;

                        if (creditAmt != null && creditAmt > 0) {
                            type = "CREDIT";
                            finalAmount = creditAmt;
                        } else if (debitAmt != null && debitAmt > 0) {
                            type = "DEBIT";
                            finalAmount = debitAmt;
                        } else if (generalAmt != null && Math.abs(generalAmt) > 0) {
                            if (typeStr != null && (typeStr.toUpperCase().contains("CR") || typeStr.toUpperCase().contains("CREDIT") || typeStr.toUpperCase().contains("IN"))) {
                                type = "CREDIT";
                            } else if (typeStr != null && (typeStr.toUpperCase().contains("DR") || typeStr.toUpperCase().contains("DEBIT") || typeStr.toUpperCase().contains("OUT"))) {
                                type = "DEBIT";
                            } else if (generalAmt < 0) {
                                type = "DEBIT";
                            } else {
                                type = "CREDIT";
                            }
                            finalAmount = Math.abs(generalAmt);
                        }

                        if (finalAmount <= 0) continue;

                        String category = categorizerService.categorize(rawDesc, type);
                        String id = UUID.randomUUID().toString();

                        result.add(new ParsedTransactionDto(
                                id,
                                normalizedDate,
                                cleanNarration(rawDesc),
                                finalAmount,
                                type,
                                category,
                                ref,
                                balance,
                                false,
                                null,
                                true
                        ));
                    } catch (Exception ex) {
                        log.debug("Skipping unparseable CSV record: {}", ex.getMessage());
                    }
                }
            }
        }

        return result;
    }

    private List<ParsedTransactionDto> parsePositional(List<String> lines, char delimiter) {
        List<ParsedTransactionDto> result = new ArrayList<>();
        for (String line : lines) {
            String[] parts = line.split(String.valueOf(delimiter));
            if (parts.length < 3) continue;

            String date = normalizeDate(parts[0]);
            if (date == null) continue;

            String desc = parts[1].replaceAll("\"", "").trim();
            Double amt = parseAmount(parts[2]);
            if (amt == null || amt == 0) continue;

            String type = amt < 0 ? "DEBIT" : "CREDIT";
            Double absAmt = Math.abs(amt);
            String cat = categorizerService.categorize(desc, type);

            result.add(new ParsedTransactionDto(
                    UUID.randomUUID().toString(),
                    date,
                    cleanNarration(desc),
                    absAmt,
                    type,
                    cat,
                    null,
                    null,
                    false,
                    null,
                    true
            ));
        }
        return result;
    }

    // -------------------------------------------------------------
    // PDF Parser
    // -------------------------------------------------------------
    public List<ParsedTransactionDto> parsePdf(MultipartFile file) throws Exception {
        List<ParsedTransactionDto> result = new ArrayList<>();

        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String fullText = stripper.getText(document);

            if (fullText == null || fullText.isBlank()) {
                return result;
            }

            String[] lines = fullText.split("\\r?\\n");
            
            // Regex patterns for standard transaction lines in Indian Bank Statements
            // e.g. "01/08/2026 UPI/Swiggy/12345/Pay 450.00 0.00 12500.00"
            // e.g. "15-Aug-2026 Salary Credit - ACH 0.00 85000.00 97500.00"
            Pattern datePrefixPattern = Pattern.compile("^(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}[-/][A-Za-z]{3}[-/]\\d{2,4}|\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2})\\s+(.+)$");

            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isBlank()) continue;

                Matcher matcher = datePrefixPattern.matcher(line);
                if (matcher.find()) {
                    String rawDate = matcher.group(1);
                    String remainder = matcher.group(2).trim();

                    String normalizedDate = normalizeDate(rawDate);
                    if (normalizedDate == null) continue;

                    // Extract numbers from the tail of remainder
                    // Search for amount tokens like "1,450.00", "500.00", "0.00"
                    List<Double> amounts = extractAmountsFromTail(remainder);
                    if (amounts.isEmpty()) continue;

                    Double finalAmount = 0.0;
                    String type = "DEBIT";
                    Double balance = null;

                    if (amounts.size() >= 3) {
                        // Typically [Withdrawal, Deposit, Balance]
                        Double debit = amounts.get(amounts.size() - 3);
                        Double credit = amounts.get(amounts.size() - 2);
                        balance = amounts.get(amounts.size() - 1);

                        if (credit > 0 && debit == 0) {
                            type = "CREDIT";
                            finalAmount = credit;
                        } else if (debit > 0) {
                            type = "DEBIT";
                            finalAmount = debit;
                        } else {
                            finalAmount = debit > 0 ? debit : credit;
                        }
                    } else if (amounts.size() == 2) {
                        // Typically [Amount, Balance] or [Debit, Credit]
                        Double first = amounts.get(0);
                        Double second = amounts.get(1);
                        if (line.toLowerCase().contains("cr") || line.toLowerCase().contains("credit") || line.toLowerCase().contains("deposit")) {
                            type = "CREDIT";
                            finalAmount = first;
                            balance = second;
                        } else {
                            type = "DEBIT";
                            finalAmount = first;
                            balance = second;
                        }
                    } else if (amounts.size() == 1) {
                        finalAmount = amounts.get(0);
                        if (line.toLowerCase().contains("cr") || line.toLowerCase().contains("credit") || line.toLowerCase().contains("refund") || line.toLowerCase().contains("salary")) {
                            type = "CREDIT";
                        } else {
                            type = "DEBIT";
                        }
                    }

                    if (finalAmount <= 0) continue;

                    String narration = extractNarrationFromRemainder(remainder, amounts);
                    String category = categorizerService.categorize(narration, type);

                    result.add(new ParsedTransactionDto(
                            UUID.randomUUID().toString(),
                            normalizedDate,
                            cleanNarration(narration),
                            finalAmount,
                            type,
                            category,
                            null,
                            balance,
                            false,
                            null,
                            true
                    ));
                }
            }
        }

        return result;
    }

    private List<Double> extractAmountsFromTail(String text) {
        List<Double> list = new ArrayList<>();
        Pattern amountPattern = Pattern.compile("(?<!\\w)[0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?(?![\\w])");
        Matcher m = amountPattern.matcher(text);
        while (m.find()) {
            Double val = parseAmount(m.group());
            if (val != null) {
                list.add(val);
            }
        }
        return list;
    }

    private String extractNarrationFromRemainder(String remainder, List<Double> amounts) {
        String res = remainder;
        for (Double amt : amounts) {
            String strAmt = String.format(Locale.ROOT, "%.2f", amt);
            res = res.replace(strAmt, "");
            res = res.replace(String.format(Locale.ROOT, "%,.2f", amt), "");
        }
        res = res.replaceAll("\\b(CR|DR|Cr|Dr)\\b", "").trim();
        return res.isBlank() ? "Bank Transaction" : res;
    }

    // -------------------------------------------------------------
    // Helper Utilities
    // -------------------------------------------------------------
    private char detectDelimiter(List<String> lines) {
        int commas = 0, semicolons = 0, tabs = 0;
        for (int i = 0; i < Math.min(lines.size(), 10); i++) {
            String l = lines.get(i);
            commas += countOccurrences(l, ',');
            semicolons += countOccurrences(l, ';');
            tabs += countOccurrences(l, '\t');
        }
        if (tabs > commas && tabs > semicolons) return '\t';
        if (semicolons > commas && semicolons > tabs) return ';';
        return ',';
    }

    private int countOccurrences(String str, char ch) {
        int c = 0;
        for (char x : str.toCharArray()) {
            if (x == ch) c++;
        }
        return c;
    }

    private int findHeaderIndex(List<String> lines, char delimiter) {
        for (int i = 0; i < Math.min(lines.size(), 25); i++) {
            String lower = lines.get(i).toLowerCase();
            if ((lower.contains("date") || lower.contains("txn")) &&
                (lower.contains("narration") || lower.contains("description") || lower.contains("particulars") || lower.contains("details") || lower.contains("amount") || lower.contains("debit") || lower.contains("credit"))) {
                return i;
            }
        }
        return 0;
    }

    private String findColumn(Map<String, Integer> headerMap, String... possibleNames) {
        // Pass 1: Exact matches
        for (String col : headerMap.keySet()) {
            String clean = col.toLowerCase().replaceAll("[^a-z0-9]", " ").trim();
            for (String target : possibleNames) {
                if (clean.equals(target)) {
                    return col;
                }
            }
        }
        // Pass 2: Whole word matches or structured contains (only for tokens > 2 chars)
        for (String col : headerMap.keySet()) {
            String clean = col.toLowerCase().replaceAll("[^a-z0-9]", " ").trim();
            String[] words = clean.split("\\s+");
            for (String target : possibleNames) {
                if (target.length() <= 2) {
                    for (String w : words) {
                        if (w.equals(target)) return col;
                    }
                } else if (clean.contains(target)) {
                    return col;
                }
            }
        }
        return null;
    }

    private String getColValue(CSVRecord record, String colName) {
        if (colName == null) return null;
        try {
            return record.get(colName);
        } catch (Exception e) {
            return null;
        }
    }

    private Double parseAmount(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            String clean = str.replaceAll("[^0-9.-]", "").trim();
            if (clean.isEmpty() || clean.equals("-") || clean.equals(".")) return null;
            return Double.parseDouble(clean);
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeDate(String input) {
        if (input == null || input.isBlank()) return null;
        String clean = input.replaceAll("\"", "").trim();

        String[] formats = {
                "yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "dd.MM.yyyy",
                "dd-MMM-yyyy", "dd/MMM/yyyy", "MM/dd/yyyy", "MM-dd-yyyy",
                "d/M/yyyy", "d-M-yyyy", "yyyy/MM/dd", "dd MMM yyyy", "yyyyMMdd"
        };

        for (String fmt : formats) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(fmt, Locale.ENGLISH);
                sdf.setLenient(false);
                Date d = sdf.parse(clean);
                SimpleDateFormat target = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                return target.format(d);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private boolean isMetadataOrSummaryRow(String text) {
        if (text == null) return true;
        String lower = text.toLowerCase(Locale.ROOT).trim();
        return lower.contains("opening balance") ||
               lower.contains("closing balance") ||
               lower.contains("brought forward") ||
               lower.contains("carried forward") ||
               lower.contains("b/f") ||
               lower.contains("c/f") ||
               lower.contains("total turnover") ||
               lower.contains("total debit") ||
               lower.contains("total credit") ||
               lower.contains("statement period") ||
               lower.contains("page ") ||
               lower.contains("generated on") ||
               lower.contains("account summary");
    }

    private String cleanNarration(String desc) {
        if (desc == null || desc.isBlank()) return "Bank Transaction";
        String clean = desc.replaceAll("[\"'\t\r\n]", " ").replaceAll("\\s+", " ").trim();

        // Check if it's a UPI transaction (e.g., UPI/234234234/SWIGGY/swiggy@icici/123)
        if (clean.toUpperCase().startsWith("UPI/") || clean.toUpperCase().contains("/UPI/")) {
            String[] tokens = clean.split("/");
            if (tokens.length >= 3) {
                // Find a token that is likely the merchant/person name (non-numeric, not "UPI", not handle)
                for (String t : tokens) {
                    String trimmed = t.trim();
                    if (!trimmed.equalsIgnoreCase("UPI") && !trimmed.matches("^[0-9]+$") && !trimmed.contains("@") && trimmed.length() > 2) {
                        return formatMerchantName(trimmed) + " (" + clean.substring(0, Math.min(clean.length(), 24)) + ")";
                    }
                }
            }
        }

        // Remove redundant leading prefixes
        clean = clean.replaceFirst("^(UPI/|POS/|NEFT/|RTGS/|IMPS/|ACH/|NACH/|INB/|MB/)", "");
        return clean.isBlank() ? "Bank Transaction" : clean;
    }

    private String formatMerchantName(String str) {
        if (str == null || str.isBlank()) return "";
        String[] words = str.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0)));
                if (w.length() > 1) {
                    sb.append(w.substring(1).toLowerCase());
                }
                sb.append(" ");
            }
        }
        return sb.toString().trim();
    }
}
