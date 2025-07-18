import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Edit, Phone, Plus, Trash2, Package, IndianRupee, CreditCard, Smartphone, Banknote, MapPin, Play, Pause, UserX, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import LayoutComponent from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { Customer, Subscription, Product, Payment } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

interface SubscriptionFormData {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  frequency: 'daily' | 'alternate' | 'custom';
  customDays: number[];
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const getProductImage = (productName: string) => {
  const imageName = productName.toLowerCase().replace(/\s+/g, '');
  return `/products/${imageName}.png`;
};

const getPaymentModeIcon = (mode: 'cash' | 'upi' | 'card') => {
  switch (mode) {
    case 'cash':
      return Banknote;
    case 'upi':
      return Smartphone;
    case 'card':
      return CreditCard;
    default:
      return IndianRupee;
  }
};

const getPaymentModeLabel = (mode: 'cash' | 'upi' | 'card') => {
  switch (mode) {
    case 'cash':
      return 'Cash';
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Card';
    default:
      return 'Payment';
  }
};

export default function CustomerDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const {
    customers,
    products,
    getCustomerSubscriptions,
    getCustomerPayments,
    updateCustomer,
    updateSubscription,
    deleteSubscription,
    addSubscription,
  } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [productSelectionOpen, setProductSelectionOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedProductForSub, setSelectedProductForSub] = useState('');
  const [formData, setFormData] = useState<SubscriptionFormData>({
    productId: '',
    quantity: 500,
    pricePerUnit: 0,
    frequency: 'daily',
    customDays: [],
  });

  const customer = customers.find(c => c.id === id);
  const customerSubscriptions = customer ? getCustomerSubscriptions(customer.id) : [];
  const customerPayments = customer ? getCustomerPayments(customer.id) : [];

  // Filter available products for subscription
  const availableProducts = products.filter(product => 
    !customerSubscriptions.some(sub => sub.productId === product.id && sub.isActive)
  );

  if (!customer) {
    return (
      <ProtectedRoute>
        <LayoutComponent title="Customer Not Found" hideBottomNav>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
              <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist.</p>
              <Button onClick={() => router.push('/customers')}>Back to Customers</Button>
            </div>
          </div>
        </LayoutComponent>
      </ProtectedRoute>
    );
  }

  const makeCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const getDirections = () => {
    if (customer.location?.address) {
      const address = encodeURIComponent(customer.location.address);
      window.open(`https://maps.google.com/?q=${address}`, '_blank');
    }
  };

  const toggleCustomerStatus = () => {
    updateCustomer(customer.id, { isActive: !customer.isActive });
  };

  const toggleSubscriptionStatus = (subscription: Subscription) => {
    updateSubscription(subscription.id, { isActive: !subscription.isActive });
  };

  const getFrequencyDisplay = (subscription: Subscription) => {
    switch (subscription.frequency) {
      case 'daily':
        return 'Daily';
      case 'alternate':
        return 'Alternate days';
      case 'custom':
        return subscription.customDays?.length 
          ? `${subscription.customDays.length} days/week`
          : 'Custom schedule';
      default:
        return subscription.frequency;
    }
  };

  const openModal = (subscription?: Subscription) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setFormData({
        productId: subscription.productId,
        quantity: subscription.quantity,
        pricePerUnit: subscription.pricePerUnit,
        frequency: subscription.frequency,
        customDays: subscription.customDays || [],
      });
      setModalOpen(true);
    } else {
      // Open product selection modal first
      setProductSelectionOpen(true);
    }
  };

  const selectProductForSubscription = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        productId: productId,
        quantity: 500,
        pricePerUnit: product.defaultPrice,
        frequency: 'daily',
        customDays: [],
      });
      setSelectedProductForSub(productId);
      setProductSelectionOpen(false);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setProductSelectionOpen(false);
    setEditingSubscription(null);
    setSelectedProductForSub('');
    setFormData({
      productId: '',
      quantity: 500,
      pricePerUnit: 0,
      frequency: 'daily',
      customDays: [],
    });
  };

  const handleCustomDayToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      customDays: prev.customDays.includes(dayValue)
        ? prev.customDays.filter(d => d !== dayValue)
        : [...prev.customDays, dayValue].sort()
    }));
  };

  const handleSubmit = () => {
    if (!formData.productId || formData.quantity <= 0 || formData.pricePerUnit <= 0) {
      return;
    }

    if (editingSubscription) {
      updateSubscription(editingSubscription.id, {
        quantity: formData.quantity,
        pricePerUnit: formData.pricePerUnit,
        frequency: formData.frequency,
        customDays: formData.customDays,
      });
    } else {
      addSubscription({
        customerId: customer.id,
        productId: formData.productId,
        quantity: formData.quantity,
        pricePerUnit: formData.pricePerUnit,
        frequency: formData.frequency,
        customDays: formData.customDays,
        startDate: new Date(),
        isActive: true,
      });
    }

    closeModal();
  };

  const handleDelete = (subscription: Subscription) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription(subscription.id);
    }
  };

  return (
    <ProtectedRoute>
      <LayoutComponent title={customer.name} hideBottomNav>
        <div className="space-y-6 pb-20 md:pb-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-semibold">{customer.name}</h1>
              <p className="text-sm text-muted-foreground">{customer.mobile}</p>
            </div>
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => makeCall(customer.mobile)}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleCustomerStatus}
                className={customer.isActive ? "text-orange-600" : "text-green-600"}
              >
                {customer.isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {customer.isActive ? 'Pause' : 'Resume'}
              </Button>
              <Button onClick={() => openModal()} size="sm" disabled={availableProducts.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push(`/customers?edit=${customer.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {/* Customer Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    customer.isActive ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {customer.isActive ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{customer.isActive ? 'Active' : 'Paused'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-medium">₹{customer.totalDues || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Products</p>
                    <p className="font-medium">{customerSubscriptions.filter(sub => sub.isActive).length} active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Address Section */}
          {customer.location?.address && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{customer.location.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/customers?edit=${customer.id}`)}
                      className="rounded-full"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={getDirections}
                      className="rounded-full"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for Subscriptions and Transactions */}
          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subscriptions">
                Subscriptions ({customerSubscriptions.length})
              </TabsTrigger>
              <TabsTrigger value="transactions">
                Transactions ({customerPayments.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="subscriptions">
              <div className="space-y-4">
                {customerSubscriptions.length > 0 ? (
                  customerSubscriptions.map((subscription) => {
                    const product = products.find(p => p.id === subscription.productId);
                    if (!product) return null;

                    return (
                      <Card key={subscription.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              <Image 
                                src={getProductImage(product.name)} 
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{product.name}</h4>
                                <Badge 
                                  variant={subscription.isActive ? 'default' : 'secondary'}
                                  className={cn(
                                    "text-xs",
                                    subscription.isActive ? "bg-green-100 text-green-800 border-green-200" : ""
                                  )}
                                >
                                  {subscription.isActive ? 'Active' : 'Paused'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{subscription.quantity}{product.unit}</span>
                                <span>₹{subscription.pricePerUnit}/{product.unit}</span>
                                <span>{getFrequencyDisplay(subscription)}</span>
                              </div>
                              
                              <div className="text-sm font-medium">
                                Monthly: ₹{(() => {
                                  const daysInMonth = subscription.frequency === 'daily' ? 30 : 
                                                     subscription.frequency === 'alternate' ? 15 : 
                                                     subscription.customDays?.length ? subscription.customDays.length * 4 : 12;
                                  const quantityInUnits = subscription.quantity / 500;
                                  return (quantityInUnits * subscription.pricePerUnit * daysInMonth).toFixed(0);
                                })()}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSubscriptionStatus(subscription)}
                                className="h-8 w-8 rounded-full"
                              >
                                {subscription.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openModal(subscription)}
                                className="h-8 w-8 rounded-full"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(subscription)}
                                className="h-8 w-8 rounded-full text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
                      <p className="text-center text-muted-foreground mb-6 max-w-sm">
                        Get started by adding the first subscription for this customer
                      </p>
                      <Button onClick={() => openModal()} disabled={availableProducts.length === 0}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Subscription
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="transactions">
              <div className="space-y-4">
                {customerPayments.length > 0 ? (
                  customerPayments.map((payment) => {
                    const PaymentIcon = getPaymentModeIcon(payment.mode);
                    
                    return (
                      <Card key={payment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <PaymentIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">₹{payment.amount}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getPaymentModeLabel(payment.mode)} • {format(new Date(payment.date), 'MMM dd, yyyy')}
                                </p>
                                {payment.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline">Received</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <IndianRupee className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                      <p className="text-center text-muted-foreground mb-6 max-w-sm">
                        Payment transactions will appear here once recorded
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Floating Action Bar - Mobile Only */}
          <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
              <div className="flex items-center justify-around p-4 gap-2">
                {/* Call Action */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => makeCall(customer.mobile)}
                  className="flex-1 rounded-full flex items-center justify-center gap-2 h-10"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-xs">Call</span>
                </Button>

                {/* Customer Pause/Resume Action */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCustomerStatus}
                  className={cn(
                    "flex-1 rounded-full flex items-center justify-center gap-2 h-10",
                    customer.isActive ? "text-orange-600" : "text-green-600"
                  )}
                >
                  {customer.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="text-xs">{customer.isActive ? 'Pause' : 'Resume'}</span>
                </Button>

                {/* Add Plan - Primary Action */}
                <Button
                  onClick={() => openModal()}
                  size="sm"
                  className="flex-1 rounded-full flex items-center justify-center gap-2 h-10"
                  disabled={availableProducts.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Add Plan</span>
                </Button>

                {/* Edit Customer */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/customers?edit=${customer.id}`)}
                  className="flex-1 rounded-full flex items-center justify-center gap-2 h-10"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-xs">Edit</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Product Selection Modal */}
          <Dialog open={productSelectionOpen} onOpenChange={setProductSelectionOpen}>
            <DialogContent className="max-w-2xl mx-4 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Choose Product</DialogTitle>
              </DialogHeader>

              <div className="py-4">
                {availableProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableProducts.map((product) => (
                      <Card 
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20"
                        onClick={() => selectProductForSubscription(product.id)}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              <Image 
                                src={getProductImage(product.name)} 
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{product.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">₹{product.defaultPrice} per {product.unit}</p>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h4 className="font-medium mb-2">All products added</h4>
                    <p className="text-sm text-muted-foreground">
                      This customer already has subscriptions for all available products.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeModal} className="rounded-full">
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Subscription Details Modal */}
          <Dialog open={modalOpen} onOpenChange={closeModal}>
            <DialogContent className="max-w-md mx-4 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingSubscription ? 'Edit Subscription' : 'Create Subscription'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Show selected product info */}
                {formData.productId && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {products.find(p => p.id === formData.productId)?.name ? (
                          <Image 
                            src={getProductImage(products.find(p => p.id === formData.productId)?.name || '')} 
                            alt={products.find(p => p.id === formData.productId)?.name || ''}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{products.find(p => p.id === formData.productId)?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Default: ₹{products.find(p => p.id === formData.productId)?.defaultPrice} per {products.find(p => p.id === formData.productId)?.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Price/Unit</Label>
                    <Input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Delivery Schedule</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: 'daily' | 'alternate' | 'custom') => {
                      setFormData({ ...formData, frequency: value, customDays: [] });
                    }}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="alternate">Alternate Days</SelectItem>
                      <SelectItem value="custom">Custom Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.frequency === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Delivery Days</Label>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={formData.customDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCustomDayToggle(day.value)}
                          className="text-xs p-2 rounded-lg"
                        >
                          {day.label.slice(0, 2)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost Summary */}
                {formData.quantity > 0 && formData.pricePerUnit > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Per delivery:</span>
                      <span className="font-medium">₹{((formData.quantity / 500) * formData.pricePerUnit).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly approx:</span>
                      <span className="font-medium">₹{(() => {
                        const daysInMonth = formData.frequency === 'daily' ? 30 : 
                                           formData.frequency === 'alternate' ? 15 : 
                                           formData.customDays.length * 4;
                        return ((formData.quantity / 500) * formData.pricePerUnit * daysInMonth).toFixed(0);
                      })()}</span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeModal} className="rounded-full">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="rounded-full">
                  {editingSubscription ? 'Update' : 'Create'} Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </LayoutComponent>
    </ProtectedRoute>
  );
} 