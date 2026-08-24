package com.fintrack.repository;

import com.fintrack.models.Credit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditRepository extends JpaRepository<Credit, String> {
    List<Credit> findByEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<Credit> findByEmailIgnoreCase(String email);
}
