package com.plateandpantry.service;

import com.plateandpantry.domain.Category;
import com.plateandpantry.domain.Product;
import com.plateandpantry.dto.AdminDtos.CategoryInput;
import com.plateandpantry.dto.AdminDtos.ProductInput;
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
public class AdminCatalogService {
    private final CategoryRepository categories;
    private final ProductRepository products;
    public AdminCatalogService(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }
    @Transactional(readOnly = true)
    public List<CategoryView> categories() { return categories.findAllByOrderBySortOrderAscNameAsc().stream().map(ViewMapper::category).toList(); }
    @Transactional
    public CategoryView createCategory(CategoryInput input) {
        if (categories.existsBySlug(input.slug())) throw conflict("CATEGORY_SLUG_EXISTS", "That category slug is already in use.");
        Category category = new Category();
        apply(category, input);
        return ViewMapper.category(categories.save(category));
    }
    @Transactional
    public CategoryView updateCategory(Long id, CategoryInput input) {
        Category category = categories.findById(id).orElseThrow(() -> notFound("Category"));
        if (categories.existsBySlugAndIdNot(input.slug(), id)) throw conflict("CATEGORY_SLUG_EXISTS", "That category slug is already in use.");
        apply(category, input);
        return ViewMapper.category(category);
    }
    @Transactional(readOnly = true)
    public List<ProductView> products() { return products.findAdminProducts().stream().map(ViewMapper::product).toList(); }
    @Transactional
    public ProductView createProduct(ProductInput input) {
        if (products.existsBySlug(input.slug())) throw conflict("PRODUCT_SLUG_EXISTS", "That product slug is already in use.");
        Product product = new Product();
        apply(product, input);
        return ViewMapper.product(products.save(product));
    }
    @Transactional
    public ProductView updateProduct(Long id, ProductInput input) {
        Product product = products.findById(id).orElseThrow(() -> notFound("Product"));
        if (products.existsBySlugAndIdNot(input.slug(), id)) throw conflict("PRODUCT_SLUG_EXISTS", "That product slug is already in use.");
        apply(product, input);
        return ViewMapper.product(product);
    }
    @Transactional
    public ProductView deactivateProduct(Long id) {
        Product product = products.findById(id).orElseThrow(() -> notFound("Product"));
        product.setActive(false);
        return ViewMapper.product(product);
    }
    private void apply(Category category, CategoryInput input) {
        category.setName(input.name().trim());
        category.setSlug(input.slug());
        category.setActive(input.active());
        category.setSortOrder(input.sortOrder());
    }
    private void apply(Product product, ProductInput input) {
        Category category = categories.findById(input.categoryId()).orElseThrow(() -> notFound("Category"));
        product.setCategory(category);
        product.setName(input.name().trim());
        product.setSlug(input.slug());
        product.setDescription(input.description().trim());
        product.setPrice(input.price().setScale(2));
        product.setImageUrl(input.imageUrl().trim());
        product.setStockQuantity(input.stockQuantity());
        product.setActive(input.active());
        product.setFeatured(input.featured());
    }
    private BusinessException notFound(String type) { return new BusinessException(HttpStatus.NOT_FOUND, type.toUpperCase() + "_NOT_FOUND", type + " was not found."); }
    private BusinessException conflict(String code, String message) { return new BusinessException(HttpStatus.CONFLICT, code, message); }
}
