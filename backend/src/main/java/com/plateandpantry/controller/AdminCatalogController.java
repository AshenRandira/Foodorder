package com.plateandpantry.controller;

import com.plateandpantry.dto.AdminDtos.*;
import com.plateandpantry.dto.MenuDtos.*;
import com.plateandpantry.service.AdminCatalogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminCatalogController {
    private final AdminCatalogService catalog;
    public AdminCatalogController(AdminCatalogService catalog) { this.catalog = catalog; }
    @GetMapping("/categories") public List<CategoryView> categories() { return catalog.categories(); }
    @PostMapping("/categories") @ResponseStatus(HttpStatus.CREATED) public CategoryView createCategory(@Valid @RequestBody CategoryInput input) { return catalog.createCategory(input); }
    @PutMapping("/categories/{id}") public CategoryView updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryInput input) { return catalog.updateCategory(id, input); }
    @GetMapping("/products") public List<ProductView> products() { return catalog.products(); }
    @PostMapping("/products") @ResponseStatus(HttpStatus.CREATED) public ProductView createProduct(@Valid @RequestBody ProductInput input) { return catalog.createProduct(input); }
    @PutMapping("/products/{id}") public ProductView updateProduct(@PathVariable Long id, @Valid @RequestBody ProductInput input) { return catalog.updateProduct(id, input); }
    @PatchMapping("/products/{id}/deactivate") public ProductView deactivateProduct(@PathVariable Long id) { return catalog.deactivateProduct(id); }
}
