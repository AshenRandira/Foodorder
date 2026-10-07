package com.plateandpantry.repository;

import com.plateandpantry.domain.CustomerOrder;
import com.plateandpantry.domain.FulfillmentStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    @EntityGraph(attributePaths = "items") Optional<CustomerOrder> findByIdempotencyKey(String key);
    @EntityGraph(attributePaths = "items") Optional<CustomerOrder> findByReferenceAndAccessToken(String reference, String token);
    @EntityGraph(attributePaths = "items") Optional<CustomerOrder> findByReference(String reference);
    @EntityGraph(attributePaths = "items") List<CustomerOrder> findAllByOrderByCreatedAtDesc();
    @EntityGraph(attributePaths = "items") List<CustomerOrder> findAllByFulfillmentStatusOrderByCreatedAtDesc(FulfillmentStatus status);
    long countByCreatedAtAfter(Instant since);
    @Query("select coalesce(sum(o.total), 0) from CustomerOrder o where o.paymentStatus = com.plateandpantry.domain.PaymentStatus.PAID")
    java.math.BigDecimal sumPaidSales();
    @Query("select coalesce(sum(o.total), 0) from CustomerOrder o where o.paymentStatus = com.plateandpantry.domain.PaymentStatus.PAID and o.createdAt >= :since")
    java.math.BigDecimal sumPaidSalesSince(@Param("since") Instant since);
}
