package com.fintrack.repository;

import com.fintrack.models.Unified;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnifiedRepository extends JpaRepository<Unified, String> {
    List<Unified> findByEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    Optional<Unified> findFirstByEmailIgnoreCaseAndDateAndCreditAndPurpose(String email, String date, Double credit, String purpose);
    Optional<Unified> findFirstByEmailIgnoreCaseAndDateAndDebitAndPurpose(String email, String date, Double debit, String purpose);

    @Transactional
    void deleteByEmailIgnoreCaseAndDateAndCreditAndPurpose(String email, String date, Double credit, String purpose);

    @Transactional
    void deleteByEmailIgnoreCaseAndDateAndDebitAndPurpose(String email, String date, Double debit, String purpose);
}
