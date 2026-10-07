package com.plateandpantry.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payment_attempts", uniqueConstraints = @UniqueConstraint(name = "uk_payment_callback", columnNames = "callback_key"))
public class PaymentAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "order_id", nullable = false) private CustomerOrder order;
    @Column(name = "callback_key", nullable = false, length = 160) private String callbackKey;
    @Column(length = 80) private String providerPaymentId;
    @Column(nullable = false, length = 20) private String statusCode;
    @Column(length = 80) private String paymentMethod;
    @Column(length = 500) private String statusMessage;
    @Column(nullable = false, updatable = false) private Instant createdAt = Instant.now();
    public Long getId() { return id; }
    public CustomerOrder getOrder() { return order; }
    public void setOrder(CustomerOrder order) { this.order = order; }
    public String getCallbackKey() { return callbackKey; }
    public void setCallbackKey(String callbackKey) { this.callbackKey = callbackKey; }
    public String getProviderPaymentId() { return providerPaymentId; }
    public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }
    public String getStatusCode() { return statusCode; }
    public void setStatusCode(String statusCode) { this.statusCode = statusCode; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }
    public Instant getCreatedAt() { return createdAt; }
}
