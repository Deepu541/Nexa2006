# Security Specification for NpMart

## Data Invariants
1. Only users with 'admin' role can approve/ban vendors and products.
2. Only users with 'vendor' role can create/update products.
3. Vendors can only update their own products.
4. Customers can only view their own orders and cart.
5. Reviews can only be created by signed-in users.
6. Public profile info is readable; private info (email/phone/address) is restricted.

## The Dirty Dozen Payloads (Attack Vectors)
1. **Self-Promotion**: Customer attempting to update their `role` to 'admin'.
2. **Identity Spoofing**: User A creating an order for User B by setting `customerId`.
3. **Price Manipulation**: Customer trying to update a product's price.
4. **Invalid Status**: Customer trying to update their order status to 'delivered'.
5. **Ghost Field Injection**: Adding `isVerified: true` to a vendor profile.
6. **Stock Drain**: Authenticated user updating a product's stock directly.
7. **Cross-Vendor Edit**: Vendor A trying to update Vendor B's product.
8. **PII Leak**: Guest user trying to read user addresses.
9. **Junk ID Poisoning**: Using a 2KB string as `productId` to cause resource bloat.
10. **Terminal State Bypass**: Updating a 'cancelled' order back to 'pending'.
11. **Negative Price**: Creating a product with `price: -100`.
12. **Unauthorized Approval**: Vendor attempting to set their own product `status` to 'approved'.

## Test Runner Logic
The accompanying `firestore.rules` will be designed to block these payloads using:
- `affectedKeys().hasOnly()` for strict updates.
- `isValidId()` for path variables.
- `get()` checks for role verification.
- Server timestamp validation for `updatedAt`.
