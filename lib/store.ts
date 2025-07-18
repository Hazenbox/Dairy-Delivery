import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  Customer, 
  Product, 
  Delivery, 
  Payment, 
  DeliveryRouteItem,
  Subscription 
} from '@/types';

// Default products for dairy delivery
const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'Milk', unit: 'L', defaultPrice: 60 },
  { id: '2', name: 'Curd', unit: 'kg', defaultPrice: 80 },
  { id: '3', name: 'Paneer', unit: 'kg', defaultPrice: 400 },
  { id: '4', name: 'Ghee', unit: 'kg', defaultPrice: 500 },
  { id: '5', name: 'Kova', unit: 'kg', defaultPrice: 300 },
  { id: '6', name: 'Bread', unit: 'piece', defaultPrice: 25 },
];

interface AppState {
  // Data
  customers: Customer[];
  products: Product[];
  deliveries: Delivery[];
  payments: Payment[];
  subscriptions: Subscription[];
  
  // UI State
  selectedDate: Date;
  isLoading: boolean;
  
  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Subscription Actions
  addSubscription: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  getCustomerSubscriptions: (customerId: string) => Subscription[];
  
  // Delivery Actions
  addDelivery: (delivery: Omit<Delivery, 'id'>) => void;
  markDelivered: (id: string, notes?: string) => void;
  markMissed: (id: string, notes?: string) => void;
  getTodaysDeliveries: () => DeliveryRouteItem[];
  getDeliveriesForDate: (date: Date) => DeliveryRouteItem[];
  
  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  getCustomerDues: (customerId: string) => number;
  getCustomerPayments: (customerId: string) => Payment[];
  
  // Product Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Utility Actions
  setSelectedDate: (date: Date) => void;
  initializeStore: () => void;
}

// Helper function to save data to localStorage
const saveToStorage = (state: any) => {
  try {
    localStorage.setItem('dairy-delivery-data', JSON.stringify({
      customers: state.customers,
      products: state.products,
      deliveries: state.deliveries,
      payments: state.payments,
      subscriptions: state.subscriptions,
    }));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  customers: [],
  products: DEFAULT_PRODUCTS,
  deliveries: [],
  payments: [],
  subscriptions: [],
  selectedDate: new Date(),
  isLoading: false,
  
  // Customer Actions
  addCustomer: (customerData) => {
    const customer: Customer = {
      ...customerData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      totalDues: 0,
    };
    set((state) => {
      const newState = { customers: [...state.customers, customer] };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    return customer;
  },
  
  updateCustomer: (id, updates) => {
    set((state) => {
      const newState = {
        customers: state.customers.map((customer) =>
          customer.id === id 
            ? { ...customer, ...updates, updatedAt: new Date() }
            : customer
        ),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  deleteCustomer: (id) => {
    set((state) => {
      const newState = {
        customers: state.customers.filter((customer) => customer.id !== id),
        deliveries: state.deliveries.filter((delivery) => delivery.customerId !== id),
        payments: state.payments.filter((payment) => payment.customerId !== id),
        subscriptions: state.subscriptions.filter((subscription) => subscription.customerId !== id),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  // Subscription Actions
  addSubscription: (subscriptionData) => {
    const subscription: Subscription = {
      ...subscriptionData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => {
      const newState = { subscriptions: [...state.subscriptions, subscription] };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  updateSubscription: (id, updates) => {
    set((state) => {
      const newState = {
        subscriptions: state.subscriptions.map((subscription) =>
          subscription.id === id 
            ? { ...subscription, ...updates, updatedAt: new Date() }
            : subscription
        ),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  deleteSubscription: (id) => {
    set((state) => {
      const newState = {
        subscriptions: state.subscriptions.filter((subscription) => subscription.id !== id),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  getCustomerSubscriptions: (customerId) => {
    const { subscriptions } = get();
    return subscriptions.filter((subscription) => subscription.customerId === customerId);
  },
  
  // Delivery Actions
  addDelivery: (deliveryData) => {
    const delivery: Delivery = {
      ...deliveryData,
      id: uuidv4(),
    };
    set((state) => {
      const newState = { deliveries: [...state.deliveries, delivery] };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  markDelivered: (id, notes) => {
    set((state) => {
      const newState = {
        deliveries: state.deliveries.map((delivery) =>
          delivery.id === id
            ? {
                ...delivery,
                status: 'delivered' as const,
                notes,
                deliveredAt: new Date(),
              }
            : delivery
        ),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  markMissed: (id, notes) => {
    set((state) => {
      const newState = {
        deliveries: state.deliveries.map((delivery) =>
          delivery.id === id
            ? {
                ...delivery,
                status: 'missed' as const,
                notes,
              }
            : delivery
        ),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  getTodaysDeliveries: () => {
    const today = new Date();
    return get().getDeliveriesForDate(today);
  },
  
  getDeliveriesForDate: (date) => {
    const { deliveries, customers, products } = get();
    const dateString = date.toDateString();
    
    const dayDeliveries = deliveries.filter(
      (delivery) => delivery.date.toDateString() === dateString
    );
    
    const groupedByCustomer = dayDeliveries.reduce((acc, delivery) => {
      const customer = customers.find((c) => c.id === delivery.customerId);
      const product = products.find((p) => p.id === delivery.productId);
      
      if (!customer || !product) return acc;
      
      if (!acc[customer.id]) {
        acc[customer.id] = {
          customer,
          deliveries: [],
          totalAmount: 0,
          status: 'pending' as const,
        };
      }
      
      acc[customer.id].deliveries.push({
        ...delivery,
        product,
      });
      
      acc[customer.id].totalAmount += delivery.amount;
      
      return acc;
    }, {} as Record<string, DeliveryRouteItem>);
    
    return Object.values(groupedByCustomer);
  },
  
  // Payment Actions
  addPayment: (paymentData) => {
    const payment: Payment = {
      ...paymentData,
      id: uuidv4(),
    };
    set((state) => {
      const newState = { payments: [...state.payments, payment] };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  getCustomerDues: (customerId) => {
    const { deliveries, payments } = get();
    
    const totalDelivered = deliveries
      .filter((d) => d.customerId === customerId && d.status === 'delivered')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const totalPaid = payments
      .filter((p) => p.customerId === customerId)
      .reduce((sum, p) => sum + p.amount, 0);
    
    return totalDelivered - totalPaid;
  },

  getCustomerPayments: (customerId) => {
    const { payments } = get();
    return payments.filter((payment) => payment.customerId === customerId);
  },
  
  // Product Actions
  addProduct: (productData) => {
    const product: Product = {
      ...productData,
      id: uuidv4(),
    };
    set((state) => {
      const newState = { products: [...state.products, product] };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  updateProduct: (id, updates) => {
    set((state) => {
      const newState = {
        products: state.products.map((product) =>
          product.id === id ? { ...product, ...updates } : product
        ),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  deleteProduct: (id) => {
    set((state) => {
      const newState = {
        products: state.products.filter((product) => product.id !== id),
      };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
  },
  
  // Utility Actions
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },
  
  initializeStore: () => {
    const state = get();
    
    // Load data from localStorage if available
    try {
      const savedData = localStorage.getItem('dairy-delivery-data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        set({
          customers: parsed.customers?.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })) || [],
          products: parsed.products || DEFAULT_PRODUCTS,
          deliveries: parsed.deliveries?.map((d: any) => ({ ...d, date: new Date(d.date), deliveredAt: d.deliveredAt ? new Date(d.deliveredAt) : undefined })) || [],
          payments: parsed.payments?.map((p: any) => ({ ...p, date: new Date(p.date) })) || [],
          subscriptions: parsed.subscriptions?.map((s: any) => ({ ...s, startDate: new Date(s.startDate), createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })) || [],
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
    
    // Only load demo data if no customers exist
    if (state.customers.length === 0) {
      // Import and load demo data
      import('@/lib/demo-data').then(({ loadDemoData }) => {
        loadDemoData(get().addCustomer);
      });
    }
  },
})); 