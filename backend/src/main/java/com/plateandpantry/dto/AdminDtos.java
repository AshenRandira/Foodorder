package com.plateandpantry.dto;

import com.plateandpantry.domain.FulfillmentStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record SessionView(boolean authenticated, String username) {}
    public record CategoryInput(@NotBlank @Size(max = 80) String name, @NotBlank @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$") String slug, boolean active, @Min(0) int sortOrder) {}
    public record ProductInput(
        @NotNull Long categoryId,
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$") String slug,
        @NotBlank @Size(max = 1000) String description,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
        @NotBlank @Size(max = 600) String imageUrl,
        @Min(0) @Max(100000) int stockQuantity,
        boolean active,
        boolean featured
    ) {}
    public record StatusInput(@NotNull FulfillmentStatus status) {}
    public record DashboardView(long totalOrders, long ordersToday, BigDecimal paidSales, BigDecimal paidSalesToday, long lowStockProducts, List<StatusCount> statusCounts) {}
    public record StatusCount(FulfillmentStatus status, long count) {}
    public record CsrfView(String headerName, String parameterName, String token) {}
}
