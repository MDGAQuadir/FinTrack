package com.fintrack.controllers;

import com.fintrack.dto.ApiResponse;
import com.fintrack.dto.LedgerRequests.*;
import com.fintrack.models.Credit;
import com.fintrack.models.Debit;
import com.fintrack.models.Unified;
import com.fintrack.models.User;
import com.fintrack.repository.CreditRepository;
import com.fintrack.repository.DebitRepository;
import com.fintrack.repository.UnifiedRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

    private static final Logger log = LoggerFactory.getLogger(LedgerController.class);

    private final CreditRepository creditRepository;
    private final DebitRepository debitRepository;
    private final UnifiedRepository unifiedRepository;
    private final UserRepository userRepository;
    private final com.fintrack.service.LedgerRecalculationService recalculationService;

    public LedgerController(
            CreditRepository creditRepository,
            DebitRepository debitRepository,
            UnifiedRepository unifiedRepository,
            UserRepository userRepository,
            com.fintrack.service.LedgerRecalculationService recalculationService) {
        this.creditRepository = creditRepository;
        this.debitRepository = debitRepository;
        this.unifiedRepository = unifiedRepository;
        this.userRepository = userRepository;
        this.recalculationService = recalculationService;
    }

    private String resolveEmail(UserPrincipal principal, String requestEmail) {
        if (principal != null && principal.getEmail() != null) {
            return principal.getEmail().trim().toLowerCase();
        }
        return requestEmail != null ? requestEmail.trim().toLowerCase() : null;
    }

    private String resolveUserId(UserPrincipal principal, String requestUserId) {
        if (principal != null && principal.getId() != null) {
            return principal.getId();
        }
        return requestUserId;
    }

    @Transactional
    public double recalculateTimelineAndSave(User user) {
        return recalculationService.recalculateTimelineAndSave(user);
    }

    @PostMapping("/credits")
    public ResponseEntity<ApiResponse> getCredits(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) GetLedgerRequest request) {

        String email = resolveEmail(principal, request != null ? request.getEmail() : null);
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Email is required").build());
        }

        List<Credit> credits = creditRepository.findByEmailIgnoreCase(email);
        credits.sort((a, b) -> {
            String dateA = a.getDate() != null ? a.getDate() : "";
            String dateB = b.getDate() != null ? b.getDate() : "";
            int dateCmp = dateB.compareTo(dateA); // Newest date first
            if (dateCmp != 0) return dateCmp;
            Date createdA = a.getCreatedAt() != null ? a.getCreatedAt() : new Date(0);
            Date createdB = b.getCreatedAt() != null ? b.getCreatedAt() : new Date(0);
            return createdB.compareTo(createdA);
        });

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .results(Map.of("data", credits))
                .build());
    }

    @PostMapping("/debits")
    public ResponseEntity<ApiResponse> getDebits(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) GetLedgerRequest request) {

        String email = resolveEmail(principal, request != null ? request.getEmail() : null);
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Email is required").build());
        }

        List<Debit> debits = debitRepository.findByEmailIgnoreCase(email);
        debits.sort((a, b) -> {
            String dateA = a.getDate() != null ? a.getDate() : "";
            String dateB = b.getDate() != null ? b.getDate() : "";
            int dateCmp = dateB.compareTo(dateA); // Newest date first
            if (dateCmp != 0) return dateCmp;
            Date createdA = a.getCreatedAt() != null ? a.getCreatedAt() : new Date(0);
            Date createdB = b.getCreatedAt() != null ? b.getCreatedAt() : new Date(0);
            return createdB.compareTo(createdA);
        });

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .results(Map.of("data", debits))
                .build());
    }

    @PostMapping("/unified")
    public ResponseEntity<ApiResponse> getUnified(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) GetLedgerRequest request) {

        String email = resolveEmail(principal, request != null ? request.getEmail() : null);
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Email is required").build());
        }

        List<Unified> unifiedList = unifiedRepository.findByEmailIgnoreCaseOrderByCreatedAtDesc(email);
        unifiedList.sort((a, b) -> {
            String dateA = a.getDate() != null ? a.getDate() : "";
            String dateB = b.getDate() != null ? b.getDate() : "";
            int dateCmp = dateB.compareTo(dateA); // Newest date first
            if (dateCmp != 0) return dateCmp;
            Date createdA = a.getCreatedAt() != null ? a.getCreatedAt() : new Date(0);
            Date createdB = b.getCreatedAt() != null ? b.getCreatedAt() : new Date(0);
            return createdB.compareTo(createdA);
        });

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .results(Map.of("data", unifiedList))
                .build());
    }

    @PostMapping("/credit")
    @Transactional
    public ResponseEntity<ApiResponse> addCredit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AddCreditRequest request) {

        String email = resolveEmail(principal, request.getEmail());
        String userId = resolveUserId(principal, request.getUserRowId());

        if (email == null || userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Authenticated user session is required.").build());
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found.").build());
        }

        User user = userOpt.get();
        if (user.getBalance() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Please set your starting balance on the profile page before recording transactions.").build());
        }

        double amtVal = request.getAmount() != null ? request.getAmount() : 0.0;

        Credit credit = new Credit();
        credit.setEmail(email);
        credit.setAmount(amtVal);
        credit.setPurpose(request.getPurpose());
        credit.setCreditedFrom(request.getCreditedFrom());
        credit.setDate(request.getDate());
        credit.setSourceOfPayment(request.getSourceOfPayment());
        credit.setNote(request.getNote());
        credit.setCreatedAt(new Date());
        credit.setUpdatedAt(new Date());
        creditRepository.save(credit);

        Unified unified = new Unified();
        unified.setEmail(email);
        unified.setDate(request.getDate());
        unified.setSourceOfPayment(request.getSourceOfPayment());
        unified.setPurpose(request.getPurpose());
        unified.setDebit(0.0);
        unified.setCredit(amtVal);
        unified.setBalance(0.0); // Will be dynamically computed by chronological timeline
        unified.setCreatedAt(new Date());
        unified.setUpdatedAt(new Date());
        unifiedRepository.save(unified);

        double updatedBalance = recalculateTimelineAndSave(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .balance(updatedBalance)
                .build());
    }

    @PostMapping("/debit")
    @Transactional
    public ResponseEntity<ApiResponse> addDebit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AddDebitRequest request) {

        String email = resolveEmail(principal, request.getEmail());
        String userId = resolveUserId(principal, request.getUserRowId());

        if (email == null || userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Authenticated user session is required.").build());
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found.").build());
        }

        User user = userOpt.get();
        if (user.getBalance() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Please set your starting balance on the profile page before recording transactions.").build());
        }

        double amtVal = request.getAmount() != null ? request.getAmount() : 0.0;

        Debit debit = new Debit();
        debit.setEmail(email);
        debit.setAmount(amtVal);
        debit.setPaymentMethod(request.getPaymentMethod());
        debit.setPaidTo(request.getPaidTo());
        debit.setDate(request.getDate());
        debit.setNote(request.getNote());
        debit.setCreatedAt(new Date());
        debit.setUpdatedAt(new Date());
        debitRepository.save(debit);

        Unified unified = new Unified();
        unified.setEmail(email);
        unified.setDate(request.getDate());
        unified.setSourceOfPayment(request.getPaymentMethod());
        unified.setPurpose(request.getPaidTo());
        unified.setDebit(amtVal);
        unified.setCredit(0.0);
        unified.setBalance(0.0); // Will be dynamically computed by chronological timeline
        unified.setCreatedAt(new Date());
        unified.setUpdatedAt(new Date());
        unifiedRepository.save(unified);

        double updatedBalance = recalculateTimelineAndSave(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .balance(updatedBalance)
                .build());
    }

    @PostMapping("/credit/delete")
    @Transactional
    public ResponseEntity<ApiResponse> deleteCredit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody DeleteCreditRequest request) {

        String email = resolveEmail(principal, request.getEmail());
        String userId = resolveUserId(principal, request.getUserRowId());

        if (email == null || userId == null || request.getCreditRowId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Authenticated user session and creditRowId are required.").build());
        }

        creditRepository.deleteById(request.getCreditRowId());

        double amtVal = request.getAmount() != null ? request.getAmount() : 0.0;
        Optional<Unified> unifiedOpt = unifiedRepository.findFirstByEmailIgnoreCaseAndDateAndCreditAndPurpose(
                email, request.getDate(), amtVal, request.getPurpose()
        );
        unifiedOpt.ifPresent(unifiedRepository::delete);

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found").build());
        }

        User user = userOpt.get();
        double updatedBalance = recalculateTimelineAndSave(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .balance(updatedBalance)
                .build());
    }

    @PostMapping("/debit/delete")
    @Transactional
    public ResponseEntity<ApiResponse> deleteDebit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody DeleteDebitRequest request) {

        String email = resolveEmail(principal, request.getEmail());
        String userId = resolveUserId(principal, request.getUserRowId());

        if (email == null || userId == null || request.getDebitRowId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Authenticated user session and debitRowId are required.").build());
        }

        debitRepository.deleteById(request.getDebitRowId());

        double amtVal = request.getAmount() != null ? request.getAmount() : 0.0;
        Optional<Unified> unifiedOpt = unifiedRepository.findFirstByEmailIgnoreCaseAndDateAndDebitAndPurpose(
                email, request.getDate(), amtVal, request.getPurpose()
        );
        unifiedOpt.ifPresent(unifiedRepository::delete);

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found").build());
        }

        User user = userOpt.get();
        double updatedBalance = recalculateTimelineAndSave(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .balance(updatedBalance)
                .build());
    }

    @PostMapping("/credit/update")
    @Transactional
    public ResponseEntity<ApiResponse> updateCredit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateCreditRequest request) {

        String email = resolveEmail(principal, request.getEmail());
        String userId = resolveUserId(principal, request.getUserRowId());

        if (email == null || userId == null || request.getCreditRowId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Authenticated user session and creditRowId are required.").build());
        }

        double oldAmt = request.getOldAmount() != null ? request.getOldAmount() : 0.0;
        double newAmt = request.getNewAmount() != null ? request.getNewAmount() : 0.0;

        Optional<Credit> creditOpt = creditRepository.findById(request.getCreditRowId());
        if (creditOpt.isPresent()) {
            Credit credit = creditOpt.get();
            credit.setAmount(newAmt);
            credit.setPurpose(request.getNewPurpose());
            credit.setCreditedFrom(request.getCreditedFrom());
            credit.setDate(request.getNewDate());
            credit.setSourceOfPayment(request.getSourceOfPayment());
            credit.setNote(request.getNote());
            credit.setUpdatedAt(new Date());
            creditRepository.save(credit);
        }

        Optional<Unified> unifiedOpt = unifiedRepository.findFirstByEmailIgnoreCaseAndDateAndCreditAndPurpose(
                email, request.getOldDate(), oldAmt, request.getOldPurpose()
        );
        if (unifiedOpt.isPresent()) {
            Unified unified = unifiedOpt.get();
            unified.setDate(request.getNewDate());
            unified.setSourceOfPayment(request.getSourceOfPayment());
            unified.setPurpose(request.getNewPurpose());
            unified.setCredit(newAmt);
            unified.setUpdatedAt(new Date());
            unifiedRepository.save(unified);
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found").build());
        }

        User user = userOpt.get();
        double updatedBalance = recalculateTimelineAndSave(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .balance(updatedBalance)
                .build());
    }

    @PostMapping("/debit/update")
    @Transactional
    public ResponseEntity<ApiResponse> updateDebit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateDebitRequest request) {

        String email = resolveEmail(principal, request.getEmail());
        String userId = resolveUserId(principal, request.getUserRowId());

        if (email == null || userId == null || request.getDebitRowId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder().success(false).message("Authenticated user session and debitRowId are required.").build());
        }

        double oldAmt = request.getOldAmount() != null ? request.getOldAmount() : 0.0;
        double newAmt = request.getNewAmount() != null ? request.getNewAmount() : 0.0;

        Optional<Debit> debitOpt = debitRepository.findById(request.getDebitRowId());
        if (debitOpt.isPresent()) {
            Debit debit = debitOpt.get();
            debit.setAmount(newAmt);
            debit.setPaidTo(request.getPaidTo());
            debit.setDate(request.getNewDate());
            debit.setPaymentMethod(request.getPaymentMethod());
            debit.setNote(request.getNote());
            debit.setUpdatedAt(new Date());
            debitRepository.save(debit);
        }

        Optional<Unified> unifiedOpt = unifiedRepository.findFirstByEmailIgnoreCaseAndDateAndDebitAndPurpose(
                email, request.getOldDate(), oldAmt, request.getOldPurpose()
        );
        if (unifiedOpt.isPresent()) {
            Unified unified = unifiedOpt.get();
            unified.setDate(request.getNewDate());
            unified.setSourceOfPayment(request.getPaymentMethod());
            unified.setPurpose(request.getPaidTo());
            unified.setDebit(newAmt);
            unified.setUpdatedAt(new Date());
            unifiedRepository.save(unified);
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.builder().success(false).message("User not found").build());
        }

        User user = userOpt.get();
        double updatedBalance = recalculateTimelineAndSave(user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .balance(updatedBalance)
                .build());
    }
}
