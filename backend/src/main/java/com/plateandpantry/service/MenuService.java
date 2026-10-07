package com.plateandpantry.service;

import com.plateandpantry.dto.MenuDtos.CategoryView;
import com.plateandpantry.dto.MenuDtos.ProductView;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.repository.CategoryRepository;
import com.plateandpantry.repository.ProductRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MenuService {
    private final CategoryRepository categories;
    private final ProductRepository products;
    public MenuService(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }
    @Transactional(readOnly = true)
    public List<CategoryView> categories() { return categories.findAllByActiveTrueOrderBySortOrderAscNameAsc().stream().map(ViewMapper::category).toList(); }
    @Transactional(readOnly = true)
    public List<ProductView> products() { return products.findPublicProducts().stream().map(ViewMapper::product).toList(); }
    @Transactional(readOnly = true)
    public ProductView product(Long id) {
        return products.findPublicById(id).map(ViewMapper::product).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "This menu item is unavailable."));
    }
}
