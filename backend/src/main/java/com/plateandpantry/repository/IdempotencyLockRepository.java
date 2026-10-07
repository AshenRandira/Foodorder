package com.plateandpantry.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface IdempotencyLockRepository extends Repository<com.plateandpantry.domain.CustomerOrder, Long> {
    @Query(value = "select pg_advisory_xact_lock(hashtextextended(:key, 0))", nativeQuery = true)
    void lock(@Param("key") String key);
}
