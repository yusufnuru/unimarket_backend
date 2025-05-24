import catchError from '../utils/cacheErrors.js';
import { getCategoryProducts, listCategories } from './categoryService.js';
import { OK } from '../constants/http.js';
import { productQuerySchema } from '../product/productSchema.js';
import { categoryParamSchema } from './categorySchema.js';

export const listCategoriesHandler = catchError(async (req, res) => {
  const { categories } = await listCategories();
  res.status(OK).json({
    message: 'Categories fetched successfully',
    categories,
  });
});

export const getCategoryProductsHandler = catchError(async (req, res) => {
  const categoryId = categoryParamSchema.parse(req.params.id);
  const request = productQuerySchema.parse(req.query);
  const { category, products, pagination } = await getCategoryProducts(categoryId, request);

  res.status(OK).json({
    message: 'Products fetched successfully',
    productsCategory: category,
    products,
    pagination,
  });
});
