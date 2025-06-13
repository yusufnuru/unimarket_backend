import catchError from '../utils/cacheErrors.js';
import { productQuerySchema, productParamSchema } from './productSchema.js';
import { OK } from '../constants/http.js';
import { getProduct, listProducts } from './productService.js';

export const getProductHandler = catchError(async (req, res) => {
  // validate request
  const productId = productParamSchema.parse(req.params.id);

  // call service
  const { product } = await getProduct(productId);

  // return response
  res.status(OK).json({
    message: 'Product fetched successfully',
    product,
  });
});

export const listProductsHandler = catchError(async (req, res) => {
  // validate request
  const query = productQuerySchema.parse(req.query);

  // call service
  const { products, pagination } = await listProducts(query);

  // return response
  res.status(OK).json({
    message: 'Products fetched successfully',
    products,
    pagination,
  });
});
