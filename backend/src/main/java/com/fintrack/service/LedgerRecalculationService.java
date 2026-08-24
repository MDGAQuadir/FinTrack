package com.fintrack.service;

import com.fintrack.models.Unified;
import com.fintrack.models.User;
import com.fintrack.repository.UnifiedRepository;
import com.fintrack.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class LedgerRecalculationService {

    private final UnifiedRepository unifiedRepository;
    private final UserRepository userRepository;

    public LedgerRecalculationService(UnifiedRepository unifiedRepository, UserRepository userRepository) {
        this.unifiedRepository = unifiedRepository;
        this.userRepository = userRepository;
    }

    /**
     * Chronologically recalculates running balance for all transactions of a user.
     * Guaranteed integrity: Sorts transactions strictly by Date ASC, then createdAt ASC,
     * applies each credit (+) and debit (-) from the user's initial wallet balance,
     * updates each transaction's running balance, and updates the user's final current balance.
     */
    @Transactional
    public double recalculateTimelineAndSave(User user) {
        if (user == null || user.getEmail() == null) return 0.0;

        // User-level synchronization lock to prevent race-condition balance drift under concurrency
        synchronized (user.getEmail().trim().toLowerCase().intern()) {
            List<Unified> records = unifiedRepository.findByEmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail());
            if (records.isEmpty()) {
                double base = user.getInitialBalance() != null ? user.getInitialBalance() : (user.getBalance() != null ? user.getBalance() : 0.0);
                user.setBalance(base);
                userRepository.save(user);
                return base;
            }

        // Sort chronologically ASCENDING (oldest date to newest date)
        records.sort((a, b) -> {
            String dateA = a.getDate() != null ? a.getDate() : "";
            String dateB = b.getDate() != null ? b.getDate() : "";
            int dateCmp = dateA.compareTo(dateB);
            if (dateCmp != 0) return dateCmp;

            Date createdA = a.getCreatedAt() != null ? a.getCreatedAt() : new Date(0);
            Date createdB = b.getCreatedAt() != null ? b.getCreatedAt() : new Date(0);
            return createdA.compareTo(createdB);
        });

        double runningBal = user.getInitialBalance() != null ? user.getInitialBalance() : 0.0;

        for (Unified r : records) {
            double credit = r.getCredit() != null ? r.getCredit() : 0.0;
            double debit = r.getDebit() != null ? r.getDebit() : 0.0;
            runningBal = Math.round((runningBal + credit - debit) * 100.0) / 100.0;
            r.setBalance(runningBal);
            r.setUpdatedAt(new Date());
        }

            unifiedRepository.saveAll(records);

            user.setBalance(runningBal);
            userRepository.save(user);

            return runningBal;
        }
    }
}
