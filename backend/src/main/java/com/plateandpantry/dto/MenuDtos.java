package com.plateandpantry.dto;

import java.math.BigDecimal;

public final class MenuDtos {
    private MenuDtos() {}
    public record CategoryView(Long id, String name, String slug, boolean active, int sortOrder) {}
    public record ProductView(Long id, String name, String slug, String description, BigDecimal price, String imageUrl, int stockQuantity, boolean available, boolean active, boolean featured, CategoryView category) {}
}
