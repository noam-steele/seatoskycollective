# Printful POD Integration Plan
## Lemon Squeezy → Pipedream → Printful Fulfillment Strategy

This document outlines the complete technical strategy for integrating Printful Print-on-Demand fulfillment with your existing Lemon Squeezy e-commerce system using Pipedream as the webhook intermediary.

---

## Step 1: Pipedream Workflow Setup

### Create Your Webhook Workflow

1. **Sign up for Pipedream** (Free Tier): [https://pipedream.com](https://pipedream.com)
2. **Create a New Workflow**:
   - Click "New Workflow"
   - Select **HTTP / Webhook** as your trigger
   - Choose **HTTP Requests with a Body**
3. **Copy Your Unique Webhook URL**:
   - Pipedream will generate a unique URL that looks like:
   ```
   https://eo[UNIQUE_ID].m.pipedream.net
   ```
   - **Save this URL** - you'll need it in Step 2

### Test Your Webhook
- Use the "Generate Test Event" button in Pipedream to ensure the trigger is working
- Keep this workflow tab open for the next steps

---

## Step 2: Lemon Squeezy Webhook Configuration

### Configure Lemon Squeezy to Send Order Events

1. **Navigate to Lemon Squeezy Dashboard**:
   - Go to **Settings → Webhooks**
   - Click **"Create Webhook"**

2. **Configure the Webhook**:
   - **Callback URL**: Paste your Pipedream webhook URL from Step 1
   - **Signing Secret**: Copy this and save it securely (you'll use it to verify webhook authenticity)
   - **Events to Send**: Select **ONLY** `order_created`
   - **Status**: Set to "Active"

3. **Save and Test**:
   - Click "Create Webhook"
   - Use the "Send Test Event" button to verify Pipedream receives the payload
   - Check your Pipedream workflow to confirm the test event appears

---

## Step 3: Printful API Authentication

### Generate and Store Your Printful API Token

1. **Create Printful API Token**:
   - Log into your [Printful Dashboard](https://www.printful.com)
   - Navigate to **Settings → Stores**
   - Select your store or create a new one
   - Go to **"Add Store"** → **"Manual Order Platform / API"**
   - Generate an **API Token** (it will look like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

2. **Store Token Securely in Pipedream**:
   - In your Pipedream workflow, click on **"Manage Environment Variables"**
   - Create a new secret:
     - **Key**: `PRINTFUL_API_TOKEN`
     - **Value**: Your Printful API token
   - Click "Save"

> **Security Note**: Never hardcode API tokens in your workflow code. Always use environment variables.

---

## Step 4: Pipedream Integration Logic (Code Step)

### Add a Node.js Code Step to Your Workflow

After your HTTP trigger, add a **Code** step with the following logic:

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    // 1. Extract data from Lemon Squeezy webhook payload
    const lemonSqueezyOrder = steps.trigger.event.body;
    
    // Verify this is an order_created event
    if (lemonSqueezyOrder.meta.event_name !== 'order_created') {
      return { message: 'Not an order_created event, skipping' };
    }
    
    const orderData = lemonSqueezyOrder.data.attributes;
    const customer = orderData.customer;
    const lineItems = orderData.first_order_item;
    
    // 2. Extract customer shipping information
    const shippingAddress = {
      name: customer.name,
      address1: customer.address1 || '',
      address2: customer.address2 || '',
      city: customer.city || '',
      state_code: customer.region || '',
      country_code: customer.country || 'US',
      zip: customer.zip || ''
    };
    
    // 3. Map Lemon Squeezy line items to Printful products
    // IMPORTANT: The variant_id must match your Printful product variant ID
    const printfulItems = [{
      variant_id: lineItems.variant_id, // This must match Printful SKU
      quantity: lineItems.quantity || 1,
      retail_price: (lineItems.price / 100).toFixed(2) // Convert cents to dollars
    }];
    
    // 4. Construct Printful API payload
    const printfulPayload = {
      recipient: shippingAddress,
      items: printfulItems,
      retail_costs: {
        currency: orderData.currency,
        subtotal: (orderData.subtotal / 100).toFixed(2),
        total: (orderData.total / 100).toFixed(2)
      },
      external_id: lemonSqueezyOrder.data.id // Link to Lemon Squeezy order
    };
    
    // 5. Send order to Printful API
    const printfulApiToken = process.env.PRINTFUL_API_TOKEN;
    
    const response = await $.send.http({
      method: 'POST',
      url: 'https://api.printful.com/orders',
      headers: {
        'Authorization': `Bearer ${printfulApiToken}`,
        'Content-Type': 'application/json'
      },
      data: printfulPayload
    });
    
    // 6. Return response for logging
    return {
      success: true,
      printful_order_id: response.result.id,
      lemon_squeezy_order_id: lemonSqueezyOrder.data.id,
      message: 'Order successfully sent to Printful'
    };
  }
});
```

### What This Code Does:
1. **Receives** the Lemon Squeezy `order_created` webhook
2. **Extracts** customer shipping details and order items
3. **Maps** product SKUs from Lemon Squeezy to Printful variant IDs
4. **Constructs** a properly formatted Printful API request
5. **Sends** the order to Printful for fulfillment
6. **Returns** confirmation with both order IDs for tracking

---

## Step 5: Product Matching Strategy

### Critical: Manual SKU Matching Required

**The most important part of this integration is ensuring your product SKUs match between Lemon Squeezy and Printful.**

### How to Match Products:

1. **In Printful**:
   - Navigate to your product in the Printful dashboard
   - Find the **Variant ID** (e.g., `12345678`)
   - This is the unique identifier for each size/color combination

2. **In Lemon Squeezy**:
   - When creating your product, use the **Variant ID** field
   - Set it to match the Printful Variant ID exactly
   - Example: If Printful Variant ID is `12345678`, your Lemon Squeezy variant should also be `12345678`

3. **Update Your Products**:
   - For your existing "604 Skyline" product:
     - Find the corresponding Printful product variant ID
     - Update the Lemon Squeezy product variant to match
   - Repeat for all future products

### Testing the Match:
1. Create a test order in Lemon Squeezy
2. Check Pipedream logs to see the payload
3. Verify the `variant_id` matches your Printful product
4. Confirm the order appears in your Printful dashboard

---

## Website Code Modifications

### No Changes Required

**Good news**: Your existing website code (`index.html`, `products.html`, `style.css`) requires **no modifications** for this integration.

The entire fulfillment process happens externally:
- Customer clicks "Download & Buy Now" → Lemon Squeezy checkout
- Customer completes purchase → Lemon Squeezy sends webhook
- Pipedream receives webhook → Sends order to Printful
- Printful fulfills order → Ships to customer

Your static site remains unchanged and continues to work exactly as it does now.

---

## Testing Checklist

Before going live, test the complete flow:

- [ ] Pipedream webhook receives Lemon Squeezy test events
- [ ] Printful API token is stored securely in Pipedream
- [ ] Code step successfully parses Lemon Squeezy payload
- [ ] Product variant IDs match between Lemon Squeezy and Printful
- [ ] Test order appears in Printful dashboard
- [ ] Shipping address is correctly formatted
- [ ] Order total matches between systems

---

## Troubleshooting

### Common Issues:

**Webhook not triggering:**
- Verify the Pipedream URL is correct in Lemon Squeezy
- Check that `order_created` event is selected
- Ensure webhook is set to "Active"

**Printful API errors:**
- Verify API token is correct and stored in environment variables
- Check that variant_id exists in your Printful store
- Ensure shipping address has all required fields

**Product not found:**
- Double-check variant ID matching between platforms
- Verify the product is published in Printful
- Confirm the product is available in the customer's country

---

## Next Steps

1. Complete Steps 1-3 to set up the infrastructure
2. Implement the code in Step 4
3. Test with a small order
4. Once confirmed working, update all product variant IDs
5. Monitor the first few real orders closely

**Support Resources:**
- [Printful API Documentation](https://developers.printful.com/)
- [Lemon Squeezy Webhooks Guide](https://docs.lemonsqueezy.com/api/webhooks)
- [Pipedream Documentation](https://pipedream.com/docs/)
