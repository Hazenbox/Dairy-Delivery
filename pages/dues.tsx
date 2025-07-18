import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, IndianRupee, CreditCard, Smartphone, Banknote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import LayoutComponent from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { PaymentMode } from '@/types';

export default function Dues() {
  const [modalActive, setModalActive] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    mode: 'cash' as PaymentMode,
    notes: '',
  });

  const { 
    customers, 
    payments,
    getCustomerDues,
    addPayment,
  } = useAppStore();

  const resetForm = () => {
    setFormData({
      customerId: '',
      amount: '',
      mode: 'cash',
      notes: '',
    });
  };

  const openPaymentModal = (customerId?: string) => {
    if (customerId) {
      const customerDues = getCustomerDues(customerId);
      setFormData({
        customerId,
        amount: customerDues.toString(),
        mode: 'cash',
        notes: '',
      });
    } else {
      resetForm();
    }
    setModalActive(true);
  };

  const closeModal = () => {
    setModalActive(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formData.customerId || !formData.amount || parseFloat(formData.amount) <= 0) return;

    addPayment({
      customerId: formData.customerId,
      amount: parseFloat(formData.amount),
      mode: formData.mode,
      date: new Date(),
      notes: formData.notes,
    });

    closeModal();
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getPaymentModeIcon = (mode: PaymentMode) => {
    switch (mode) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'upi':
        return <Smartphone className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <IndianRupee className="h-4 w-4" />;
    }
  };

  const getPaymentModeLabel = (mode: PaymentMode) => {
    switch (mode) {
      case 'cash':
        return 'Cash';
      case 'upi':
        return 'UPI';
      case 'card':
        return 'Card';
      default:
        return mode;
    }
  };

  // Get customers with dues
  const customersWithDues = customers.map(customer => ({
    ...customer,
    dues: getCustomerDues(customer.id),
  })).filter(customer => customer.dues !== 0);

  // Get recent payments
  const recentPayments = payments
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 20);

  // Calculate stats
  const totalOutstanding = customersWithDues.reduce((sum, c) => sum + Math.max(0, c.dues), 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const customersWithOverdues = customersWithDues.filter(c => c.dues > 0).length;

  return (
    <LayoutComponent title="Dues">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dues Management</h1>
            <p className="text-sm text-muted-foreground">
              Track outstanding payments and record collections
            </p>
          </div>
          <Button onClick={() => openPaymentModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{customersWithOverdues}</p>
                  <p className="text-sm text-muted-foreground">Customers with Dues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">₹{totalOutstanding}</p>
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">₹{totalCollected}</p>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers with Dues */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Dues</CardTitle>
            <CardDescription>
              Customers with pending payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customersWithDues.length === 0 ? (
              <div className="text-center py-12">
                <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No outstanding dues!</h3>
                <p className="text-muted-foreground">
                  All customers are up to date with their payments! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customersWithDues.map((customer) => {
                  const isOverdue = customer.dues > 0;
                  const isAdvance = customer.dues < 0;
                  
                  return (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{customer.name}</h4>
                        <p className="text-sm text-muted-foreground">{customer.mobile}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-semibold">₹{Math.abs(customer.dues)}</p>
                        <Badge variant={isOverdue ? 'destructive' : 'success'}>
                          {isOverdue ? 'Overdue' : 'Advance'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openPaymentModal(customer.id)}
                      >
                        Record Payment
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Latest payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{getCustomerName(payment.customerId)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(payment.date, 'MMM dd, yyyy')}
                      </p>
                      {payment.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{payment.amount}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {getPaymentModeIcon(payment.mode)}
                        <span className="ml-1">{getPaymentModeLabel(payment.mode)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Modal */}
        <Dialog open={modalActive} onOpenChange={closeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => {
                    const dues = getCustomerDues(value);
                    setFormData({ 
                      ...formData, 
                      customerId: value,
                      amount: dues.toString()
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} (₹{getCustomerDues(customer.id)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => setFormData({ ...formData, mode: value as PaymentMode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Add notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  Record Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutComponent>
  );
} 