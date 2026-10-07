package com.plateandpantry.repository;

import com.plateandpantry.domain.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    boolean existsByCallbackKey(String callbackKey);
}
