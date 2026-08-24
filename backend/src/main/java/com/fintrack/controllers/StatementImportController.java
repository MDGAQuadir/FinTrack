package com.fintrack.controllers;

import com.fintrack.dto.StatementImportDto.ParsedTransactionDto;
import com.fintrack.dto.StatementImportDto.StatementImportCommitRequest;
import com.fintrack.dto.StatementImportDto.StatementImportCommitResponse;
import com.fintrack.dto.StatementImportDto.StatementImportPreviewResponse;
import com.fintrack.models.Credit;
import com.fintrack.models.Debit;
import com.fintrack.models.Unified;
import com.fintrack.models.User;
import com.fintrack.repository.CreditRepository;
import com.fintrack.repository.DebitRepository;
import com.fintrack.repository.UnifiedRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.UserPrincipal;
import com.fintrack.service.BankStatementParserService;
import com.fintrack.service.DuplicateDetectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/statement/import")
public class StatementImportController {

    private static final Logger log = LoggerFactory.getLogger(StatementImportController.class);

    private final BankStatementParserService parserService;
    private final DuplicateDetectionService duplicateDetectionService;
    private final UserRepository userRepository;
    private final CreditRepository creditRepository;
    private final DebitRepository debitRepository;
    private final UnifiedRepository unifiedRepository;
    private final LedgerController ledgerController;

    public StatementImportController(
            BankStatementParserService parserService,
            DuplicateDetectionService duplicateDetectionService,
            UserRepository userRepository,
            CreditRepository creditRepository,
            DebitRepository debitRepository,
            UnifiedRepository unifiedRepository,
            LedgerController ledgerController) {
        this.parserService = parserService;
        this.duplicateDetectionService = duplicateDetectionService;
        this.userRepository = userRepository;
        this.creditRepository = creditRepository;
        this.debitRepository = debitRepository;
        this.unifiedRepository = unifiedRepository;
        this.ledgerController = ledgerController;
    }

    private User resolveUser(UserPrincipal principal, String emailParam) {
        if (principal != null && principal.getUser() != null) {
            return principal.getUser();
        }
        String email = principal != null ? principal.getEmail() : emailParam;
        if (email != null && !email.isBlank()) {
            return userRepository.findByEmailIgnoreCase(email.trim().toLowerCase()).orElse(null);
        }
        return null;
    }

    @PostMapping("/preview")
    public ResponseEntity<StatementImportPreviewResponse> previewStatement(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "email", required = false) String emailParam,
            @AuthenticationPrincipal UserPrincipal principal) {

        StatementImportPreviewResponse response = new StatementImportPreviewResponse();

        if (file == null || file.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Please provide a valid statement file (PDF or CSV).");
            return ResponseEntity.badRequest().body(response);
        }

        User user = resolveUser(principal, emailParam);
        if (user == null) {
            response.setSuccess(false);
            response.setMessage("User account not found. Please ensure you are logged in.");
            return ResponseEntity.status(401).body(response);
        }

        try {
            String[] detectedFormat = new String[1];
            List<ParsedTransactionDto> parsed = parserService.parseFile(file, detectedFormat);

            if (parsed.isEmpty()) {
                response.setSuccess(false);
                response.setMessage("Could not detect tabular transaction records in this file. Ensure it is a valid bank statement.");
                return ResponseEntity.ok(response);
            }

            // Flag duplicates against user's existing records
            duplicateDetectionService.checkAndFlagDuplicates(user, parsed);

            int totalDebits = 0;
            int totalCredits = 0;
            int duplicates = 0;
            double inflow = 0.0;
            double outflow = 0.0;

            for (ParsedTransactionDto tx : parsed) {
                if (Boolean.TRUE.equals(tx.getIsDuplicate())) {
                    duplicates++;
                }
                if ("CREDIT".equalsIgnoreCase(tx.getType())) {
                    totalCredits++;
                    inflow += (tx.getAmount() != null ? tx.getAmount() : 0.0);
                } else {
                    totalDebits++;
                    outflow += (tx.getAmount() != null ? tx.getAmount() : 0.0);
                }
            }

            response.setSuccess(true);
            response.setMessage("Successfully extracted " + parsed.size() + " transactions from statement.");
            response.setFilename(file.getOriginalFilename());
            response.setDetectedFormat(detectedFormat[0]);
            response.setTotalParsed(parsed.size());
            response.setTotalDebits(totalDebits);
            response.setTotalCredits(totalCredits);
            response.setDuplicatesCount(duplicates);
            response.setInflowAmount(inflow);
            response.setOutflowAmount(outflow);
            response.setTransactions(parsed);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to parse statement: {}", e.getMessage(), e);
            response.setSuccess(false);
            response.setMessage("Failed to process statement: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/commit")
    @Transactional
    public ResponseEntity<StatementImportCommitResponse> commitImport(
            @RequestBody StatementImportCommitRequest request,
            @RequestParam(value = "email", required = false) String emailParam,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (request == null || request.getTransactions() == null || request.getTransactions().isEmpty()) {
            return ResponseEntity.badRequest().body(new StatementImportCommitResponse(false, "No transactions provided for import.", 0, 0.0));
        }

        User user = resolveUser(principal, emailParam);
        if (user == null) {
            return ResponseEntity.status(401).body(new StatementImportCommitResponse(false, "User account not found.", 0, 0.0));
        }

        List<ParsedTransactionDto> toImport = request.getTransactions().stream()
                .filter(t -> Boolean.TRUE.equals(t.getSelected()))
                .toList();

        if (toImport.isEmpty()) {
            return ResponseEntity.badRequest().body(new StatementImportCommitResponse(false, "No transactions were selected for import.", 0, user.getBalance() != null ? user.getBalance() : 0.0));
        }

        int count = 0;
        Date now = new Date();

        for (ParsedTransactionDto item : toImport) {
            String date = item.getDate() != null ? item.getDate() : new java.text.SimpleDateFormat("yyyy-MM-dd").format(now);
            Double amount = item.getAmount() != null ? Math.abs(item.getAmount()) : 0.0;
            if (amount <= 0) continue;

            String type = item.getType() != null ? item.getType().toUpperCase() : "DEBIT";
            String category = item.getCategory() != null && !item.getCategory().isBlank() ? item.getCategory() : (type.equals("CREDIT") ? "Other Income" : "General Expense");
            String description = item.getDescription() != null ? item.getDescription() : "Bank Statement Import";

            if ("CREDIT".equalsIgnoreCase(type)) {
                Credit credit = new Credit();
                credit.setEmail(user.getEmail());
                credit.setDate(date);
                credit.setAmount(amount);
                credit.setCreditedFrom(description);
                credit.setPurpose(category);
                credit.setSourceOfPayment("Bank Statement Import");
                credit.setNote(description);
                credit.setCreatedAt(now);
                credit.setUpdatedAt(now);
                creditRepository.save(credit);

                Unified u = new Unified();
                u.setEmail(user.getEmail());
                u.setDate(date);
                u.setCredit(amount);
                u.setDebit(0.0);
                u.setPurpose(category);
                u.setSourceOfPayment("Bank Statement Import");
                u.setBalance(user.getBalance() != null ? user.getBalance() : 0.0);
                u.setCreatedAt(now);
                u.setUpdatedAt(now);
                unifiedRepository.save(u);
            } else {
                Debit debit = new Debit();
                debit.setEmail(user.getEmail());
                debit.setDate(date);
                debit.setAmount(amount);
                debit.setPaidTo(description);
                debit.setPaymentMethod(category);
                debit.setNote(description);
                debit.setCreatedAt(now);
                debit.setUpdatedAt(now);
                debitRepository.save(debit);

                Unified u = new Unified();
                u.setEmail(user.getEmail());
                u.setDate(date);
                u.setDebit(amount);
                u.setCredit(0.0);
                u.setPurpose(category);
                u.setSourceOfPayment("Bank Statement Import");
                u.setBalance(user.getBalance() != null ? user.getBalance() : 0.0);
                u.setCreatedAt(now);
                u.setUpdatedAt(now);
                unifiedRepository.save(u);
            }

            count++;
        }

        // Chronologically recalculate running timeline and user balance
        double updatedBalance = ledgerController.recalculateTimelineAndSave(user);

        log.info("✅ Imported {} statement transactions for user {}. New Balance: ₹{}", count, user.getEmail(), updatedBalance);

        return ResponseEntity.ok(new StatementImportCommitResponse(
                true,
                String.format("Successfully imported %d transactions! Ledger and running balance updated.", count),
                count,
                updatedBalance
        ));
    }
}
