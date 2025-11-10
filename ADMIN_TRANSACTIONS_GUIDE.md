# Admin Transaction Management Guide

## Overview
Comprehensive transaction management system that allows admins to view, filter, search, and manage all payment transactions from the platform.

## Features

### 🎯 Transaction Display

Each transaction shows:
- **Customer Information**: Profile image, name, username, email
- **Amount**: Payment amount with currency (e.g., $3.99 USD)
- **Plan Type**: Monthly or Lifetime
- **Payment Gateway**: Stripe, PayPal, or Unknown (with icons)
- **Status**: Succeeded, Pending, Failed, or Refunded (color-coded)
- **Date & Time**: When the transaction occurred
- **Actions**: View details and delete options

### 🔍 Advanced Filtering

#### Search
- **Search by Email**: Find transactions by customer email
- **Search by Transaction ID**: Search using internal or external ID
- **Debounced**: 500ms delay to reduce API calls

#### Status Filter
- All Statuses (default)
- Succeeded (green badge)
- Pending (yellow badge)
- Failed (red badge)
- Refunded (purple badge)

#### Payment Gateway Filter
- All Gateways (default)
- Stripe
- PayPal

#### Date Range Filter
- **Date From**: Start date for range
- **Date To**: End date for range
- Both fields optional

#### Clear Filters
- One-click button to reset all filters
- Returns to default view

### 📄 Pagination

- **10 transactions per page**
- Smart page navigation (shows first, last, current, and adjacent pages)
- Previous/Next buttons
- Result count display
- Automatically resets to page 1 when filters change

### 👁️ View Transaction Details

Click the eye icon to see complete transaction information:

#### Customer Section
- Large profile image or avatar
- Full name and username
- Email address
- Clickable link to user profile (future enhancement)

#### Payment Information
- **Amount Card**: Large display of payment amount
- **Plan Type Card**: Monthly or Lifetime
- **Payment Gateway Card**: Gateway name with branded icon
- **Status Card**: Color-coded status badge

#### Transaction Details
- **Transaction ID**: Internal database ID
- **External ID**: Stripe/PayPal transaction ID
- **Event Type**: Stripe event name (if available)
- **Transaction Date**: Full date and time

### 🗑️ Delete Transaction

Click the trash icon to delete a transaction:

1. **Confirmation Modal** appears with:
   - Warning message
   - Transaction summary (amount, email, date)
   - "Cannot be undone" notice
2. **Cancel** or **Delete** options
3. On delete:
   - Transaction removed from database
   - List refreshes automatically
   - Stays on current page if possible

## Payment Gateway Detection

The system automatically detects payment gateways:

### Stripe Detection
External IDs starting with:
- `ch_` - Charge ID
- `cs_` - Checkout Session ID
- `pi_` - Payment Intent ID

### PayPal Detection
External IDs containing:
- `paypal` string

### Icons
- **Stripe**: `fab fa-stripe` (Stripe brand icon)
- **PayPal**: `fab fa-paypal` (PayPal brand icon)
- **Unknown**: `fas fa-credit-card` (Generic card icon)

## Color Coding

### Status Badges
- **Succeeded**: Green (`bg-green-500/20 text-green-300`)
- **Pending**: Yellow (`bg-yellow-500/20 text-yellow-300`)
- **Failed**: Red (`bg-red-500/20 text-red-300`)
- **Refunded**: Purple (`bg-purple-500/20 text-purple-300`)

### User Avatars
- Real profile image if available
- Generated gradient avatar with first letter
- Different color for "user not found"

## API Endpoints

### GET `/api/admin/transactions`
List transactions with filtering and pagination.

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 10)
search: string (email or transaction ID)
status: 'all' | 'succeeded' | 'pending' | 'failed' | 'refunded'
gateway: 'all' | 'stripe' | 'paypal'
dateFrom: ISO date string
dateTo: ISO date string
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "plan_type": "monthly",
      "amount": 3.99,
      "currency": "usd",
      "status": "succeeded",
      "external_id": "ch_xxxxx",
      "event_type": "charge.succeeded",
      "created_at": "2025-11-09T...",
      "user": {
        "id": "uuid",
        "username": "john",
        "name": "John Doe",
        "profile_image": "url"
      },
      "paymentGateway": "Stripe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### GET `/api/admin/transactions/[id]`
Get single transaction details.

**Response:**
```json
{
  "transaction": {
    // Same as above, with full user details
  }
}
```

### DELETE `/api/admin/transactions/[id]`
Delete a transaction.

**Response:**
```json
{
  "message": "Transaction deleted successfully"
}
```

## Database Schema

### billing_transactions Table
```sql
CREATE TABLE billing_transactions (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'succeeded',
  event_type VARCHAR(100),
  external_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Guide

### Basic View
1. Navigate to `/admin/transactions`
2. See all transactions in reverse chronological order
3. View user, amount, status at a glance

### Search for Transactions
1. Type in search box (email or ID)
2. Results appear after 500ms
3. Clear with X button or "Clear Filters"

### Filter by Status
1. Click status dropdown
2. Select: All, Succeeded, Pending, Failed, or Refunded
3. Table updates instantly

### Filter by Gateway
1. Click gateway dropdown
2. Select: All, Stripe, or PayPal
3. Table updates instantly

### Filter by Date Range
1. Click "Date From" and select start date
2. Click "Date To" and select end date
3. Leave either blank for open-ended range
4. Click "Clear Filters" to reset

### View Transaction Details
1. Click eye icon on any transaction
2. Review all transaction information
3. Click "Close" to return to list

### Delete Transaction
1. Click trash icon (red)
2. Read confirmation warning
3. Click "Delete Transaction" to confirm
4. Or click "Cancel" to abort

## Security

### Admin Authentication
- All endpoints require authenticated admin session
- Non-admins receive 403 Forbidden
- Unauthenticated users redirected to login

### Data Protection
- Admin-only access to transaction data
- Secure deletion (no soft deletes)
- Audit trail via admin_logs (future enhancement)

## Error Handling

### Common Errors

**"Failed to load transactions"**
- Network issue or database error
- Check console for details
- Refresh page to retry

**"Transaction not found"**
- Transaction was deleted
- Invalid transaction ID
- Refresh list to update

**"Failed to delete transaction"**
- Database error
- Transaction doesn't exist
- Check permissions

### User Feedback
- Red error banners for issues
- Loading spinners for async operations
- "Deleting..." button state
- Empty state messages

## Performance

### Optimizations
- Debounced search (500ms)
- Pagination (10 per page)
- Indexed database queries
- Efficient joins with users table
- Client-side state management

### Scalability
- Handles thousands of transactions
- Fast search with indexed columns
- Date range queries optimized
- Async user data fetching

## Best Practices

### When to Delete Transactions
✅ **DO Delete:**
- Test transactions
- Duplicate entries
- Erroneous records
- Refunded with record elsewhere

❌ **DON'T Delete:**
- Active subscription payments
- Audit trail data
- Recent successful payments
- Disputed transactions (wait for resolution)

### Filtering Tips
1. Start broad, then narrow filters
2. Use date ranges for historical analysis
3. Combine filters for specific queries
4. Clear filters between searches

### Search Tips
- Use full email for exact match
- Partial email works too
- External ID for Stripe/PayPal lookup
- Case-insensitive search

## Future Enhancements (Optional)

- [ ] Export transactions to CSV
- [ ] Refund transaction from admin panel
- [ ] Transaction analytics and charts
- [ ] Bulk operations
- [ ] Advanced search (amount range, plan type)
- [ ] Transaction notes/comments
- [ ] Email customer from transaction view
- [ ] View customer's all transactions
- [ ] Revenue reports by date/gateway/plan
- [ ] Failed payment retry
- [ ] Webhook event history
- [ ] Audit log for deletions

## Troubleshooting

### Transactions Not Loading
1. Check admin authentication
2. Verify database connection
3. Check browser console for errors
4. Try clearing filters
5. Refresh the page

### Search Not Working
1. Wait for debounce (500ms)
2. Check search term spelling
3. Try partial matches
4. Clear and re-type search

### Filters Not Applying
1. Check if "Clear Filters" was clicked
2. Verify dropdown selection
3. Ensure date format is correct
4. Try removing and re-adding filter

### User Not Showing
- User may have been deleted
- Email mismatch in database
- Check users table for that email

## Testing Checklist

- [ ] View all transactions
- [ ] Search by email
- [ ] Search by transaction ID
- [ ] Filter by succeeded status
- [ ] Filter by failed status
- [ ] Filter by pending status
- [ ] Filter by refunded status
- [ ] Filter by Stripe gateway
- [ ] Filter by PayPal gateway
- [ ] Filter by date range (from only)
- [ ] Filter by date range (to only)
- [ ] Filter by date range (both)
- [ ] Clear all filters
- [ ] View transaction details
- [ ] Delete transaction
- [ ] Cancel delete
- [ ] Pagination navigation
- [ ] Page 1, 2, 3 buttons
- [ ] Previous/Next buttons
- [ ] Search resets to page 1
- [ ] Empty state display
- [ ] Loading state display

---

**Status**: ✅ Complete and Ready for Production

**Last Updated**: November 9, 2025

