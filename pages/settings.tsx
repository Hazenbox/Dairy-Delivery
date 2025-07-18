import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, RefreshCw, Edit, Plus, Package, Users, IndianRupee, Truck, CheckCircle, Clock } from 'lucide-react';
import LayoutComponent from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppStore } from '@/lib/store';
import { Product } from '@/types';

export default function Settings() {
  const { 
    customers, 
    deliveries, 
    payments, 
    products,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useAppStore();
  
  // Product management state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    unit: '',
    defaultPrice: '',
  });

  const unitOptions = [
    { label: 'Liters', value: 'L' },
    { label: 'Kilograms', value: 'kg' },
    { label: 'Pieces', value: 'piece' },
    { label: 'Bottles', value: 'bottle' },
    { label: 'Packets', value: 'packet' },
  ];

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('dairy-delivery-data');
      window.location.reload();
    }
  };

  const loadDemoData = () => {
    if (confirm('Load demo data? This will add sample customers.')) {
      localStorage.removeItem('dairy-delivery-data');
      window.location.reload();
    }
  };

  // Product management functions
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        unit: product.unit,
        defaultPrice: product.defaultPrice.toString(),
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        unit: 'L',
        defaultPrice: '',
      });
    }
    setProductModalOpen(true);
  };

  const closeProductModal = () => {
    setProductModalOpen(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      unit: '',
      defaultPrice: '',
    });
  };

  const handleProductSubmit = () => {
    if (!productForm.name || !productForm.unit || !productForm.defaultPrice) {
      alert('Please fill in all fields');
      return;
    }

    const productData = {
      name: productForm.name,
      unit: productForm.unit,
      defaultPrice: parseFloat(productForm.defaultPrice),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }

    closeProductModal();
  };

  const handleDeleteProduct = (product: Product) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) {
      return;
    }
    
    deleteProduct(product.id);
  };

  return (
    <ProtectedRoute>
      <LayoutComponent title="Settings">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account and application preferences
            </p>
          </div>

          {/* Daily Delivery Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Delivery Overview</CardTitle>
              <CardDescription>
                Real-time delivery statistics for {format(new Date(), 'MMM dd, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{(() => {
                    const today = new Date();
                    const todaysDeliveries = deliveries.filter(d => 
                      new Date(d.date).toDateString() === today.toDateString()
                    );
                    return todaysDeliveries.length;
                  })()}</div>
                  <div className="text-sm text-muted-foreground">Total Deliveries</div>
                </div>
                
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{(() => {
                    const today = new Date();
                    const completedToday = deliveries.filter(d => 
                      new Date(d.date).toDateString() === today.toDateString() && d.status === 'delivered'
                    );
                    return completedToday.length;
                  })()}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <div className="text-2xl font-bold text-yellow-600">{(() => {
                    const today = new Date();
                    const pendingToday = deliveries.filter(d => 
                      new Date(d.date).toDateString() === today.toDateString() && d.status === 'pending'
                    );
                    return pendingToday.length;
                  })()}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                
                <div className="text-center">
                  <IndianRupee className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                  <div className="text-2xl font-bold text-indigo-600">₹{(() => {
                    const today = new Date();
                    const todaysAmount = deliveries
                      .filter(d => new Date(d.date).toDateString() === today.toDateString())
                      .reduce((sum, d) => sum + d.amount, 0);
                    return todaysAmount;
                  })()}</div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Stats Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Overall statistics for your dairy business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{customers.length}</div>
                  <div className="text-sm text-muted-foreground">Customers</div>
                </div>
                
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{products.length}</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                
                <div className="text-center">
                  <IndianRupee className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <div className="text-2xl font-bold">{payments.length}</div>
                  <div className="text-sm text-muted-foreground">Payments</div>
                </div>
                
                <div className="text-center">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{deliveries.length}</div>
                  <div className="text-sm text-muted-foreground">Total Deliveries</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Product Management</CardTitle>
                <Button onClick={() => openProductModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {products.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Unit: {product.unit} • Default Price: ₹{product.defaultPrice}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openProductModal(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {products.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No products added yet. Click "Add Product" to get started.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your application data and settings
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Load Demo Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Load sample data to test the application
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={loadDemoData}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load Demo Data
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Clear All Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove all customers, deliveries, and payments
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={clearAllData}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Modal */}
        <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product details' : 'Create a new product for your catalog'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="e.g., Milk"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-unit">Unit</Label>
                <Select 
                  value={productForm.unit} 
                  onValueChange={(value) => setProductForm({ ...productForm, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-price">Default Price (₹)</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="0.00"
                  value={productForm.defaultPrice}
                  onChange={(e) => setProductForm({ ...productForm, defaultPrice: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeProductModal}>
                Cancel
              </Button>
              <Button onClick={handleProductSubmit}>
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </LayoutComponent>
    </ProtectedRoute>
  );
} 