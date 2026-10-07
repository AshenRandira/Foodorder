package com.plateandpantry.service;

import com.plateandpantry.domain.*;
import com.plateandpantry.dto.MenuDtos.*;
import com.plateandpantry.dto.OrderDtos.*;
import java.util.List;

public final class ViewMapper {
    private ViewMapper() {}
    public static CategoryView category(Category c) {
        return new CategoryView(c.getId(), c.getName(), c.getSlug(), c.isActive(), c.getSortOrder());
    }
    public static ProductView product(Product p) {
        return new ProductView(p.getId(), p.getName(), p.getSlug(), p.getDescription(), p.getPrice(), p.getImageUrl(), p.getStockQuantity(), p.isActive() && p.getStockQuantity() > 0, p.isActive(), p.isFeatured(), category(p.getCategory()));
    }
    public static OrderView order(CustomerOrder order) {
        List<OrderItemView> items = order.getItems().stream().map(i -> new OrderItemView(i.getProductId(), i.getProductName(), i.getUnitPrice(), i.getQuantity(), i.getLineTotal())).toList();
        return new OrderView(order.getReference(), order.getCustomerName(), order.getPhone(), order.getEmail(), order.getDeliveryAddress(), order.getNotes(), order.getPaymentMethod(), order.getPaymentStatus(), order.getFulfillmentStatus(), order.getSubtotal(), order.getDeliveryFee(), order.getTotal(), order.getCurrency(), items, order.getCreatedAt());
    }
}
