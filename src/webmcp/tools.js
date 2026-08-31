import '@mcp-b/global';
import { addToCart, applyDiscount, logActivity, searchProducts } from '../state.js';

function textResult(text, isError = false) {
  const result = { content: [{ type: 'text', text }] };
  if (isError) result.isError = true;
  return result;
}

async function withLogging(name, args, run) {
  try {
    const { text, payload } = await run();
    logActivity({ tool: name, args, result: payload, isError: false });
    return textResult(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logActivity({ tool: name, args, result: { error: message }, isError: true });
    return textResult(message, true);
  }
}

async function registerTools() {
  await document.modelContext.registerTool({
    name: 'search_products',
    description: 'Search the product catalog by name or tag',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text matched against product name or tag' },
      },
      required: ['query'],
    },
    async execute(args) {
      return withLogging('search_products', args, () => {
        const matches = searchProducts(args.query);
        return {
          payload: matches,
          text: matches.length
            ? `Found ${matches.length} product(s): ${matches.map((p) => p.name).join(', ')}`
            : `No products matched "${args.query}"`,
        };
      });
    },
  });

  await document.modelContext.registerTool({
    name: 'add_to_cart',
    description: 'Add a product to the shopping cart by product id',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'Product id, e.g. "p1"' },
        quantity: { type: 'integer', description: 'Quantity to add (defaults to 1)' },
      },
      required: ['product_id'],
    },
    async execute(args) {
      return withLogging('add_to_cart', args, () => {
        const { product, quantity } = addToCart(args.product_id, args.quantity);
        return {
          payload: { productId: product.id, quantity },
          text: `Added ${quantity} x ${product.name} to cart`,
        };
      });
    },
  });

  await document.modelContext.registerTool({
    name: 'apply_discount_code',
    description: 'Apply a discount code to the cart. Only "SAVE10" is valid.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Discount code to apply' },
      },
      required: ['code'],
    },
    async execute(args) {
      return withLogging('apply_discount_code', args, () => {
        const discount = applyDiscount(args.code);
        return {
          payload: discount,
          text: `Applied discount code ${discount.code} (${discount.percent}% off)`,
        };
      });
    },
  });
}

export const toolsReady = registerTools();
