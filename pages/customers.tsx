import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Plus, Phone, Edit, Trash2, Users, MapPin, IndianRupee, Search, Filter, SortAsc, SortDesc } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import LayoutComponent from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { Customer, Product } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

// Add Customer Modal Component
const AddCustomerModal = ({ 
  open, 
  onClose, 
  editingCustomer = null 
}: { 
  open: boolean; 
  onClose: () => void; 
  editingCustomer?: Customer | null;
}) => {
  const { 
    products, 
    addCustomer, 
    updateCustomer, 
    addSubscription,
    getCustomerSubscriptions,
    updateSubscription,
  } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
  });

  const [selectedProducts, setSelectedProducts] = useState<{
    [key: string]: {
      selected: boolean;
      quantity: number;
      frequency: 'daily' | 'alternative days' | 'weekly';
      price: number;
    }
  }>({});

  const [totalBill, setTotalBill] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when editing
  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        name: editingCustomer.name,
        mobile: editingCustomer.mobile,
        address: editingCustomer.location?.address || '',
      });

      // Load existing subscriptions for editing
      const subscriptions = getCustomerSubscriptions(editingCustomer.id);
      const productData: any = {};
      
      products.forEach(product => {
        const subscription = subscriptions.find(sub => sub.productId === product.id && sub.isActive);
        productData[product.id] = {
          selected: !!subscription,
          quantity: subscription?.quantity || 500,
          frequency: subscription?.frequency === 'daily' ? 'daily' : 
                    subscription?.frequency === 'alternate' ? 'alternative days' : 'weekly',
          price: product.defaultPrice,
        };
      });
      
      setSelectedProducts(productData);
    } else {
      // Initialize with default values for new customer
      const productData: any = {};
      products.forEach(product => {
        productData[product.id] = {
          selected: false,
          quantity: 500,
          frequency: 'daily' as const,
          price: product.defaultPrice,
        };
      });
      setSelectedProducts(productData);
    }
  }, [editingCustomer, products, getCustomerSubscriptions]);

  // Calculate total bill
  useEffect(() => {
    const total = Object.entries(selectedProducts).reduce((sum, [productId, data]) => {
      if (data.selected) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const daysInMonth = data.frequency === 'daily' ? 30 : 
                             data.frequency === 'alternative days' ? 15 : 4;
          const quantityInUnits = data.quantity / 500;
          const pricePerUnit = product.defaultPrice;
          return sum + (quantityInUnits * pricePerUnit * daysInMonth);
        }
      }
      return sum;
    }, 0);
    setTotalBill(total);
  }, [selectedProducts, products]);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: !prev[productId].selected,
        quantity: !prev[productId].selected ? 500 : prev[productId].quantity,
      }
    }));
  };

  const getQuantityOptions = (productName: string) => {
    const baseUnit = productName.toLowerCase().includes('milk') ? 'ml' : 'g';
    return [
      { value: 500, label: `500${baseUnit}` },
      { value: 1000, label: `1000${baseUnit}` },
      { value: 1500, label: `1500${baseUnit}` },
      { value: 2000, label: `2000${baseUnit}` },
      { value: 2500, label: `2500${baseUnit}` },
      { value: 3000, label: `3000${baseUnit}` },
    ];
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!formData.mobile.trim()) {
      setError('Please enter mobile number');
      return;
    }

    const selectedProductsCount = Object.values(selectedProducts).filter(p => p.selected).length;
    if (selectedProductsCount === 0) {
      setError('Please select at least one product');
      return;
    }

    setIsLoading(true);

    try {
      let customerId: string;
      
      if (editingCustomer) {
        // Update existing customer
        updateCustomer(editingCustomer.id, {
          name: formData.name,
          mobile: formData.mobile,
          location: {
            lat: 0,
            lng: 0,
            address: formData.address
          }
        });
        customerId = editingCustomer.id;
      } else {
        // Add new customer
        const newCustomer = {
          name: formData.name,
          mobile: formData.mobile,
          location: {
            lat: 0,
            lng: 0,
            address: formData.address
          },
          isActive: true,
          totalDues: 0,
        };
        
        const createdCustomer = addCustomer(newCustomer);
        customerId = createdCustomer.id;
      }

      // Handle subscriptions
      Object.entries(selectedProducts).forEach(([productId, data]) => {
        if (data.selected) {
          const subscription = {
            customerId,
            productId,
            quantity: data.quantity,
            pricePerUnit: data.price,
            frequency: data.frequency === 'daily' ? 'daily' as const : 
                      data.frequency === 'alternative days' ? 'alternate' as const : 'custom' as const,
            customDays: data.frequency === 'daily' ? [] : 
                       data.frequency === 'alternative days' ? [] : [1, 3, 5],
            startDate: new Date(),
            isActive: true,
          };
          
          addSubscription(subscription);
        }
      });

      onClose();
      
      // Reset form
      setFormData({ name: '', mobile: '', address: '' });
      setSelectedProducts({});
      
    } catch (error) {
      setError('Failed to save customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  className="text-base"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="text-base"
              />
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Select Products</h3>
              <div className="text-sm text-muted-foreground">
                {Object.values(selectedProducts).filter(p => p.selected).length} selected
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {products.map((product) => {
                const productData = selectedProducts[product.id];
                if (!productData) return null;

                return (
                  <Card key={product.id} className={cn(
                    "cursor-pointer transition-all hover:shadow-sm",
                    productData.selected ? "ring-2 ring-primary bg-primary/5" : ""
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={productData.selected}
                          onCheckedChange={() => handleProductToggle(product.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-sm md:text-base">{product.name}</CardTitle>
                          <CardDescription className="text-xs md:text-sm">₹{product.defaultPrice} per 500{product.unit}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {productData.selected && (
                      <CardContent className="pt-0 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs md:text-sm">Quantity</Label>
                            <Select
                              value={productData.quantity.toString()}
                              onValueChange={(value) => {
                                setSelectedProducts(prev => ({
                                  ...prev,
                                  [product.id]: {
                                    ...prev[product.id],
                                    quantity: parseInt(value),
                                  }
                                }));
                              }}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getQuantityOptions(product.name).map(option => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs md:text-sm">Frequency</Label>
                            <Select
                              value={productData.frequency}
                              onValueChange={(value) => {
                                setSelectedProducts(prev => ({
                                  ...prev,
                                  [product.id]: {
                                    ...prev[product.id],
                                    frequency: value as 'daily' | 'alternative days' | 'weekly',
                                  }
                                }));
                              }}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="alternative days">Alternative Days</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Quick calculation preview */}
                        <div className="text-xs text-muted-foreground border rounded-lg p-2">
                          Monthly: ₹{(() => {
                            const daysInMonth = productData.frequency === 'daily' ? 30 : 
                                               productData.frequency === 'alternative days' ? 15 : 4;
                            const quantityInUnits = productData.quantity / 500;
                            const pricePerUnit = product.defaultPrice;
                            return (quantityInUnits * pricePerUnit * daysInMonth).toFixed(0);
                          })()}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Total Bill */}
          {totalBill > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
                  <div>
                    <span className="text-base md:text-lg font-semibold">Estimated Monthly Bill</span>
                    <p className="text-xs md:text-sm text-muted-foreground">Based on selected products and frequency</p>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-primary">₹{totalBill.toFixed(0)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}
        </div>

        {/* Sticky Action Buttons */}
        <div className="sticky bottom-0 bg-background border-t p-4 md:p-6">
          <div className="flex flex-col-reverse md:flex-row justify-end space-y-2 space-y-reverse md:space-y-0 md:space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="md:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="md:w-auto">
              {isLoading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Customers Component
export default function Customers() {
  const router = useRouter();
  const { edit } = router.query;
  const { 
    customers, 
    deleteCustomer, 
    getCustomerDues,
    deliveries,
    products,
  } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'dues' | 'recent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'dues'>('all');

  // Handle edit parameter from URL
  useEffect(() => {
    if (edit && typeof edit === 'string') {
      const customerToEdit = customers.find(c => c.id === edit);
      if (customerToEdit) {
        setEditingCustomer(customerToEdit);
        setModalOpen(true);
        // Remove the edit parameter from URL
        router.replace('/customers', undefined, { shallow: true });
      }
    }
  }, [edit, customers, router]);

  // Enhanced filtering and sorting with useMemo for performance
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      // Search filter
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.mobile.includes(searchTerm);
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && customer.isActive) ||
                           (filterStatus === 'inactive' && !customer.isActive) ||
                           (filterStatus === 'dues' && getCustomerDues(customer.id) > 0);
      
      return matchesSearch && matchesStatus;
    });

    // Sort customers
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'dues':
          comparison = getCustomerDues(a.id) - getCustomerDues(b.id);
          break;
        case 'recent':
          const aRecentDelivery = deliveries
            .filter(d => d.customerId === a.id)
            .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
          const bRecentDelivery = deliveries
            .filter(d => d.customerId === b.id)
            .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
          
          const aDate = aRecentDelivery ? new Date(aRecentDelivery.date).getTime() : 0;
          const bDate = bRecentDelivery ? new Date(bRecentDelivery.date).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [customers, searchTerm, sortBy, sortOrder, filterStatus, getCustomerDues, deliveries]);

  // Get customer's recent products
  const getCustomerRecentProducts = (customerId: string) => {
    const customerDeliveries = deliveries
      .filter(d => d.customerId === customerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    
    const productCounts = customerDeliveries.reduce((acc, delivery) => {
      const product = products.find(p => p.id === delivery.productId);
      if (product) {
        if (!acc[product.name]) {
          acc[product.name] = { name: product.name, unit: product.unit, count: 0 };
        }
        acc[product.name].count += delivery.quantity;
      }
      return acc;
    }, {} as Record<string, { name: string; unit: string; count: number }>);
    
    return Object.values(productCounts);
  };

  const openModal = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteCustomer(customer.id);
    }
  };

  const makeCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <ProtectedRoute>
      <LayoutComponent title="Customers">
        <div className="space-y-6 pb-20 md:pb-6">
          {/* Header - Clean and minimal */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Customers</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {customers.length} customers • {customers.filter(c => c.isActive).length} active
              </p>
            </div>
            {/* Desktop Add Button */}
            <Button onClick={() => openModal()} className="hidden md:flex rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>

          {/* Search and Filters - Enhanced Design */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-full"
              />
            </div>

            {/* Filters Row */}
            <div className="flex space-x-2">
              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive' | 'dues') => setFilterStatus(value)}>
                <SelectTrigger className="w-[110px] h-10 rounded-full">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="dues">With Dues</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={sortBy} onValueChange={(value: 'name' | 'dues' | 'recent') => setSortBy(value)}>
                <SelectTrigger className="w-[100px] h-10 rounded-full">
                  {sortOrder === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="dues">Dues</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="h-10 w-10 rounded-full"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          {searchTerm || filterStatus !== 'all' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredAndSortedCustomers.length} of {customers.length} customers</span>
              {(searchTerm || filterStatus !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                  className="h-7 px-2 text-xs rounded-full"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : null}

          {/* Customer List */}
          {filteredAndSortedCustomers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-center text-muted-foreground mb-6 max-w-sm">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria to find customers'
                    : 'Start building your customer base by adding your first customer'
                  }
                </p>
                {(!searchTerm && filterStatus === 'all') && (
                  <Button onClick={() => openModal()} className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile List View - Enhanced */}
              <div className="block md:hidden space-y-3">
                {filteredAndSortedCustomers.map((customer: Customer) => {
                  const dues = getCustomerDues(customer.id);
                  const recentProducts = getCustomerRecentProducts(customer.id);
                  
                  return (
                    <Card 
                      key={customer.id} 
                      className="cursor-pointer transition-all hover:shadow-sm active:scale-[0.98] border-0 shadow-sm"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarFallback className="text-sm">
                                {getUserInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium text-base truncate">{customer.name}</h3>
                                {!customer.isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Paused
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-2">
                                {customer.mobile}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {dues > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    ₹{dues.toFixed(0)} due
                                  </Badge>
                                )}
                                {recentProducts.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {recentProducts.length} products
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => makeCall(customer.mobile)}
                              className="h-9 w-9 rounded-full"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openModal(customer)}
                              className="h-9 w-9 rounded-full"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Card View - Enhanced */}
              <div className="hidden md:grid gap-4">
                {filteredAndSortedCustomers.map((customer: Customer) => {
                  const dues = getCustomerDues(customer.id);
                  const recentProducts = getCustomerRecentProducts(customer.id);
                  
                  return (
                    <Card 
                      key={customer.id} 
                      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-1 items-center space-x-4 min-w-0">
                            <Avatar className="h-14 w-14 shrink-0">
                              <AvatarFallback className="text-base font-medium">
                                {getUserInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{customer.name}</h3>
                                <div className="flex items-center gap-2">
                                  {!customer.isActive && (
                                    <Badge variant="secondary" className="text-xs">
                                      Paused
                                    </Badge>
                                  )}
                                  {dues > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      ₹{dues.toFixed(0)} due
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                {customer.mobile}
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                {recentProducts.length > 0 ? (
                                  <span className="line-clamp-1">
                                    Recent: {recentProducts.map(p => `${p.name} (${p.count}${p.unit})`).join(', ')}
                                  </span>
                                ) : (
                                  <span>No recent orders</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => makeCall(customer.mobile)}
                              className="h-9 w-9 rounded-full"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openModal(customer)}
                              className="h-9 w-9 rounded-full"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Danger Zone - Enhanced Design */}
              {filteredAndSortedCustomers.length > 0 && (
                <div className="border-t pt-8 mt-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete customers and all their data. This action cannot be undone.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {filteredAndSortedCustomers.map((customer: Customer) => (
                      <Card key={customer.id} className="border-destructive/30 bg-destructive/5">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-sm">
                                  {getUserInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">{customer.mobile}</p>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(customer)}
                              className="rounded-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mobile FAB - Enhanced */}
          <Button
            onClick={() => openModal()}
            className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden z-50"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>

          {/* Add Customer Modal */}
          <AddCustomerModal 
            open={modalOpen} 
            onClose={closeModal}
            editingCustomer={editingCustomer}
          />
        </div>
      </LayoutComponent>
    </ProtectedRoute>
  );
} 