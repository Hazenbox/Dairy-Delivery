import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LayoutComponent from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase, Product } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      price: '',
    });
    setEditingProduct(null);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        unit: product.unit,
        price: product.price.toString(),
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!user) return;

    const productData = {
      name: formData.name,
      unit: formData.unit,
      price: parseFloat(formData.price) || 0,
      is_active: true,
      created_by: user.id,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Error updating product:', error);
          return;
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) {
          console.error('Error creating product:', error);
          return;
        }
      }

      await fetchProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        return;
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) {
        console.error('Error updating product:', error);
        return;
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const unitOptions = [
    { label: 'Liter (L)', value: 'L' },
    { label: 'Milliliter (ml)', value: 'ml' },
    { label: 'Kilogram (kg)', value: 'kg' },
    { label: 'Gram (g)', value: 'g' },
    { label: 'Piece (pc)', value: 'pc' },
    { label: 'Pack (pack)', value: 'pack' },
  ];

  if (user?.role !== 'admin') {
    return (
      <LayoutComponent title="Access Denied">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </LayoutComponent>
    );
  }

  return (
    <ProtectedRoute>
      <LayoutComponent title="Product Management">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Products</h1>
              <p className="text-sm text-muted-foreground">
                Manage your product catalog
              </p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product List</CardTitle>
              <CardDescription>
                All products in your catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add products to start managing your catalog.
                  </p>
                  <Button onClick={() => openModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? 'success' : 'destructive'}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModal(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(product)}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Product Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
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
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </LayoutComponent>
    </ProtectedRoute>
  );
} 