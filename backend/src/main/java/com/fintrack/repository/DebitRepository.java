package com.fintrack.repository;

import com.fintrack.models.Debit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebitRepository extends JpaRepository<Debit, String> {
    List<Debit> findByEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<Debit> findByEmailIgnoreCase(String email);
}
