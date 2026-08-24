package com.fintrack.service;

import com.fintrack.dto.StatementImportDto.ParsedTransactionDto;
import com.fintrack.models.Credit;
import com.fintrack.models.Debit;
import com.fintrack.models.User;
import com.fintrack.repository.CreditRepository;
import com.fintrack.repository.DebitRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DuplicateDetectionService {

    private final CreditRepository creditRepository;
    private final DebitRepository debitRepository;

    public DuplicateDetectionService(CreditRepository creditRepository, DebitRepository debitRepository) {
        this.creditRepository = creditRepository;
        this.debitRepository = debitRepository;
    }

    public void checkAndFlagDuplicates(User user, List<ParsedTransactionDto> parsedList) {
        if (user == null || user.getEmail() == null || parsedList == null || parsedList.isEmpty()) {
            return;
        }

        List<Credit> existingCredits = creditRepository.findByEmailIgnoreCase(user.getEmail());
        List<Debit> existingDebits = debitRepository.findByEmailIgnoreCase(user.getEmail());

        for (ParsedTransactionDto tx : parsedList) {
            boolean isDup = false;
            String reason = null;

            if ("CREDIT".equalsIgnoreCase(tx.getType())) {
                for (Credit ec : existingCredits) {
                    if (matches(tx, ec.getDate(), ec.getAmount(), ec.getCreditedFrom(), ec.getPurpose())) {
                        isDup = true;
                        reason = "Matches existing Credit (₹" + ec.getAmount() + " on " + ec.getDate() + ")";
                        break;
                    }
                }
            } else {
                for (Debit ed : existingDebits) {
                    if (matches(tx, ed.getDate(), ed.getAmount(), ed.getPaidTo(), ed.getNote())) {
                        isDup = true;
                        reason = "Matches existing Debit (₹" + ed.getAmount() + " on " + ed.getDate() + ")";
                        break;
                    }
                }
            }

            tx.setIsDuplicate(isDup);
            tx.setDuplicateReason(reason);
            // Default selected = true if not duplicate, false if duplicate
            tx.setSelected(!isDup);
        }
    }

    private boolean matches(ParsedTransactionDto parsed, String date, Double amount, String field1, String field2) {
        if (parsed.getAmount() == null || amount == null) return false;
        
        // Exact amount match
        if (Math.abs(parsed.getAmount() - amount) > 0.01) {
            return false;
        }

        // Date match (normalized string comparison)
        if (parsed.getDate() != null && date != null && !parsed.getDate().equalsIgnoreCase(date)) {
            return false;
        }

        // Reference / Description similarity
        String desc = parsed.getDescription() != null ? parsed.getDescription().toLowerCase() : "";
        String f1 = field1 != null ? field1.toLowerCase() : "";
        String f2 = field2 != null ? field2.toLowerCase() : "";

        if (!f1.isBlank() && (desc.contains(f1) || f1.contains(desc))) {
            return true;
        }
        if (!f2.isBlank() && (desc.contains(f2) || f2.contains(desc))) {
            return true;
        }

        // If date and amount match exactly, flag as likely duplicate
        return true;
    }
}
