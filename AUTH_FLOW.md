# 🔐 Pagent Credits Authentication Flow

## Overview

Pagent Credits uses a secure, wallet-first authentication system designed for Coinbase Smart Wallet and mini-app environments. No database credentials are exposed to the frontend.

## 🏗️ Architecture

```
Frontend (Vercel) → Supabase Edge Functions → Database
     ↓                        ↓                   ↓
1. Wallet signature     2. Verify signature   3. Store user
2. Get JWT token       3. Create/update user  4. Return profile
3. Store session       4. Generate JWT
```

## 🔄 Authentication Flow

### 1. **Initial Load**
- App checks for existing session in `sessionStorage`
- Restores auth state if valid token found
- Shows welcome screen if not authenticated

### 2. **Wallet Connection**
- User clicks "Connect Coinbase Smart Wallet"
- OnchainKit handles wallet connection
- Auto-triggers authentication when wallet connects

### 3. **Message Signing**
```typescript
const message = `Welcome to Pagent Credits! 🎉

Please sign this message to securely authenticate your wallet.

🔐 Wallet: 0x1234...5678
⏰ Time: 12/8/2024, 3:45:32 PM
🎲 Nonce: abc123

✅ This signature is safe and will not trigger any blockchain transaction or cost gas.

By signing, you agree to our Terms of Service.`
```

### 4. **Edge Function Authentication**
- Frontend calls `/auth-public` (no anon key needed)
- Edge Function verifies signature using `viem`
- Creates/updates user record in database
- Generates JWT token with user data

### 5. **Session Management**
- JWT stored in `sessionStorage` for mini-app
- User profile cached locally
- Auto-logout on wallet disconnect

## 🛡️ Security Features

### ✅ **What's Secure**
- No database credentials in frontend
- Wallet signature verification
- JWT-based authentication
- Session auto-cleanup
- HTTPS-only in production

### 🚫 **What's NOT Exposed**
- Supabase anon key
- Service role keys
- JWT secrets
- Database connection strings

## 📱 Mini-App Optimized

### **Coinbase Wallet Integration**
- Smart Wallet preference
- Touch-friendly UI
- Session persistence
- Auto-reconnect

### **User Experience**
- One-time signature setup
- Seamless navigation
- Clear error messages
- Loading states

## 🔧 Environment Variables

### **Frontend (Vercel)**
```env
# Only this is needed!
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1

# Optional
NEXT_PUBLIC_COINBASE_API_KEY=your_coinbase_api_key
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

### **Edge Functions (Supabase)**
```env
# These stay on the server
SUPABASE_URL=internal
SUPABASE_SERVICE_ROLE_KEY=internal
JWT_SECRET=your_jwt_secret
```

## 🎯 Auth States

### **Loading**
```typescript
{ isLoading: true, isAuthenticated: false }
```

### **Unauthenticated**
```typescript
{ 
  isLoading: false, 
  isAuthenticated: false,
  error: null 
}
```

### **Connecting**
```typescript
{ 
  isLoading: false, 
  isAuthenticated: false,
  isConnecting: true 
}
```

### **Authenticated**
```typescript
{ 
  isLoading: false, 
  isAuthenticated: true,
  user: {
    id: "uuid",
    address: "0x...",
    ensName: "vitalik.eth",
    createdAt: "2024-01-01T00:00:00Z",
    isNewUser: false
  },
  token: "jwt..."
}
```

## 🔄 API Calls

### **Authentication**
```typescript
import { authenticateWallet } from '../lib/secure-auth'

const response = await authenticateWallet(address, message, signature)
```

### **Authenticated Requests**
```typescript
import { SecureAPI } from '../lib/secure-auth'

const cards = await SecureAPI.getCards(token)
const credits = await SecureAPI.getCredits(token)
```

## 🐛 Error Handling

### **User-Friendly Messages**
- "Please sign the message to continue" (user rejected)
- "Network error. Please try again." (network issues)
- "Session expired" (token expired)

### **Auto-Recovery**
- Clear invalid sessions
- Redirect to re-auth
- Preserve user intent

## 🚀 Deployment

1. **Deploy Frontend to Vercel**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**
   - Only `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` required
   - No secrets exposed

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy auth-public
   supabase functions deploy cards
   supabase functions deploy credits
   # etc...
   ```

## 📊 Benefits

### **Security**
- ✅ Zero-trust architecture
- ✅ No exposed credentials
- ✅ Signature-based auth
- ✅ JWT expiration

### **UX**
- ✅ One-click connect
- ✅ Auto-authentication
- ✅ Session persistence
- ✅ Clear feedback

### **Performance**
- ✅ Client-side session
- ✅ Cached user data
- ✅ Fast reconnection
- ✅ Minimal requests

---

*This auth flow provides enterprise-grade security while maintaining the seamless experience expected in a Coinbase Wallet mini-app environment.*