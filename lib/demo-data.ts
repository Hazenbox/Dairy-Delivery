import { Customer } from '@/types';

export const DEMO_CUSTOMERS: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Rajesh Kumar',
    mobile: '+91 98765 43210',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Block A, Sector 15, New Delhi',
    },
    isActive: true,
    totalDues: 0,
  },
  {
    name: 'Priya Sharma',
    mobile: '+91 87654 32109',
    location: {
      lat: 28.6155,
      lng: 77.2112,
      address: 'House 25, Green Park Extension, New Delhi',
    },
    isActive: true,
    totalDues: 0,
  },
  {
    name: 'Amit Patel',
    mobile: '+91 76543 21098',
    location: {
      lat: 28.6170,
      lng: 77.2134,
      address: 'Flat 12B, Sunrise Apartments, New Delhi',
    },
    isActive: true,
    totalDues: 0,
  },
  {
    name: 'Kavya Reddy',
    mobile: '+91 65432 10987',
    location: {
      lat: 28.6185,
      lng: 77.2156,
      address: 'Villa 8, Palm Grove Society, New Delhi',
    },
    isActive: true,
    totalDues: 0,
  },
  {
    name: 'Suresh Gupta',
    mobile: '+91 54321 09876',
    location: {
      lat: 28.6200,
      lng: 77.2178,
      address: 'Shop 15, Main Market, New Delhi',
    },
    isActive: true,
    totalDues: 0,
  },
];

export const loadDemoData = (addCustomer: any) => {
  console.log('Loading demo data...');
  
  // Add demo customers
  DEMO_CUSTOMERS.forEach(customerData => {
    addCustomer(customerData);
  });
  
  console.log(`Demo data loaded: ${DEMO_CUSTOMERS.length} customers`);
}; 