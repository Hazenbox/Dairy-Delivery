## 🥛 **Dairy Friend**

A modern, Progressive Web App (PWA) built for dairy businesses to streamline customer management, delivery tracking, and payment collection.

---

## ✨ **Key Features**

### 👥 **Customer Management**
- **Add & Edit** - Complete customer profiles with contact details
- **Location Tracking** - GPS coordinates for delivery routes
- **Status Management** - Active/inactive customer handling

### 📦 **Product Management**
- **Product Catalog** - Manage dairy products with units and pricing
- **Flexible Units** - Support for liters, kilograms, pieces, bottles, packets

### 🚚 **Delivery Management**
- **Manual Delivery Creation** - Create deliveries for specific customers and products
- **Route Optimization** - Location-based delivery planning
- **Status Tracking** - Mark deliveries as delivered, missed, or cancelled

### 💰 **Payment Tracking**
- **Multiple Payment Modes** - Cash, UPI, and card payments
- **Due Management** - Automatic calculation of customer dues
- **Payment History** - Complete transaction records

### 📱 **Progressive Web App**
- **Offline Support** - Works without internet connection
- **Mobile Optimized** - Touch-friendly interface for mobile devices
- **Install on Device** - Add to home screen like a native app

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18.17.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hazenbox/Dairy-Delivery.git
   cd Dairy-Delivery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

---

## 📖 **Getting Started Guide**

### First Time Setup

1. **Add Products** - Go to Settings and add your dairy products
2. **Add Customers** - Create customer profiles with delivery addresses
3. **Create Deliveries** - Manually create deliveries for customers
4. **Track Payments** - Record payments and monitor dues

---

## 📁 **Project Structure**

```
dairy-delivery/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main navigation layout
├── lib/                # Core business logic
│   ├── store.ts        # Zustand state management
│   └── demo-data.ts    # Sample data for testing
├── pages/              # Next.js pages
│   ├── index.tsx       # Deliveries dashboard
│   ├── customers.tsx   # Customer management
│   ├── dues.tsx        # Payment tracking
│   └── settings.tsx    # App configuration
├── public/             # Static assets
├── styles/             # Global CSS styles
└── types/              # TypeScript type definitions
    └── index.ts        # Core data types
```

---

## 🔧 **Configuration**

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# App Configuration
NEXT_PUBLIC_APP_NAME="Dairy Friend"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Database (if using external storage)
DATABASE_URL="your-database-url"

# Optional: Analytics
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
```

---

## 💾 **Data Types**

### Customer
```typescript
interface Customer {
  id: string;
  name: string;
  mobile: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  isActive: boolean;
  totalDues: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Product
```typescript
interface Product {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
}
```

### Delivery
```typescript
interface Delivery {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  price: number;
  date: Date;
  status: 'pending' | 'delivered' | 'missed' | 'cancelled';
  notes?: string;
  deliveredAt?: Date;
  amount: number;
}
```

### Payment
```typescript
interface Payment {
  id: string;
  customerId: string;
  amount: number;
  mode: 'cash' | 'upi' | 'card';
  date: Date;
  notes?: string;
  deliveryIds?: string[];
}
```

---

## 🛠 **Built With**

- **Framework**: Next.js 13+ with TypeScript
- **UI Library**: Shopify Polaris
- **State Management**: Zustand
- **Storage**: LocalStorage (with optional database integration)
- **PWA**: Next-PWA plugin
- **Styling**: CSS Modules + Polaris Design System

---

## 📱 **PWA Features**

- **Offline Functionality**: Core features work without internet
- **App-like Experience**: Install on mobile/desktop home screen
- **Background Sync**: Data syncs when connection is restored
- **Push Notifications**: Delivery reminders (optional)

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

Need help? Here are some resources:

- **Documentation**: Check this README for detailed setup instructions
- **Issues**: Report bugs or request features via GitHub Issues
- **Community**: Join our discussions for tips and best practices

---

**Made with ❤️ for dairy businesses everywhere**
