import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { DeliveryRouteItem } from '@/types';
import LayoutComponent from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone, 
  MapPin, 
  Plus,
  Users,
  Calendar as CalendarIcon,
  Truck,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';


type FilterType = 'all' | 'pending' | 'delivered' | 'missed';
type MissedReason = 'not_available' | 'rejected' | 'pause';

export default function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [missedModalOpen, setMissedModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [missedReason, setMissedReason] = useState<MissedReason>('not_available');
  const [pauseDays, setPauseDays] = useState('7');
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { 
    getDeliveriesForDate,
    markDelivered, 
    markMissed,
    selectedDate,
    setSelectedDate,
  } = useAppStore();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const todaysDeliveries = getDeliveriesForDate(selectedDate);
  
  const completedDeliveries = todaysDeliveries.reduce((count: number, item: DeliveryRouteItem) => {
    return count + item.deliveries.filter((d: any) => d.status === 'delivered').length;
  }, 0);

  const totalDeliveries = todaysDeliveries.reduce((count: number, item: DeliveryRouteItem) => {
    return count + item.deliveries.length;
  }, 0);

  const totalAmount = todaysDeliveries.reduce((sum: number, item: DeliveryRouteItem) => {
    return sum + item.totalAmount;
  }, 0);

  const handleDeliveryAction = (deliveryId: string, status: 'delivered' | 'missed') => {
    if (status === 'delivered') {
      markDelivered(deliveryId, 'Delivered successfully');
    } else {
      const delivery = todaysDeliveries
        .flatMap(item => item.deliveries)
        .find(d => d.id === deliveryId);
      setSelectedDelivery(delivery);
      setMissedModalOpen(true);
    }
  };

  const handleMissedSubmit = () => {
    if (selectedDelivery) {
      let reason = '';
      switch (missedReason) {
        case 'not_available':
          reason = 'Customer not available';
          break;
        case 'rejected':
          reason = 'Customer rejected delivery';
          break;
        case 'pause':
          reason = `Customer wants to pause for ${pauseDays} days`;
          break;
      }
      markMissed(selectedDelivery.id, reason);
      setMissedModalOpen(false);
      setSelectedDelivery(null);
      setMissedReason('not_available');
      setPauseDays('7');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge variant="success" className="inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Delivered
          </Badge>
        );
      case 'missed':
        return (
          <Badge variant="destructive" className="inline-flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Missed
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const makeCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFilteredDeliveries = () => {
    switch (selectedFilter) {
      case 'pending':
        return todaysDeliveries.filter(item => 
          item.deliveries.some(d => d.status === 'pending')
        );
      case 'delivered':
        return todaysDeliveries.filter(item => 
          item.deliveries.every(d => d.status === 'delivered')
        );
      case 'missed':
        return todaysDeliveries.filter(item => 
          item.deliveries.some(d => d.status === 'missed')
        );
      default:
        return todaysDeliveries;
    }
  };

  const filteredDeliveries = getFilteredDeliveries();

  const pendingCount = todaysDeliveries.filter(item => 
    item.deliveries.some(d => d.status === 'pending')
  ).length;
  
  const deliveredCount = todaysDeliveries.filter(item => 
    item.deliveries.every(d => d.status === 'delivered')
  ).length;
  
  const missedCount = todaysDeliveries.filter(item => 
    item.deliveries.some(d => d.status === 'missed')
  ).length;

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  return (
    <ProtectedRoute>
      <LayoutComponent title="Deliveries">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold tracking-tight">
                Deliveries - {getDateLabel(selectedDate)}
              </h1>
            </div>
            <div className="flex items-center gap-1 md:gap-2 w-full">
              {/* Navigation Arrows and Calendar */}
              <div className="flex items-center gap-1 md:gap-2 flex-1">
                {/* Left Arrow - Desktop Only */}
                {!isMobile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }}
                    className="shrink-0 h-9 w-9 md:h-8 md:w-8 touch-manipulation"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                {/* Week Calendar - Mobile-Optimized Responsive Design */}
                <div className="flex-1 md:flex-none">
                  <div 
                    className="flex items-center gap-1 md:gap-1.5 p-1 md:p-1.5 rounded-lg overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    style={{
                      backgroundColor: '#F7F7F7',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {Array.from({ length: isMobile ? 7 : 14 }, (_, i) => {
                      const date = new Date();
                      if (isMobile) {
                        // Mobile: Show 7 days centered around today
                        date.setDate(date.getDate() - 3 + i); // Show 3 days before, today, and 3 days after
                      } else {
                        // Desktop: Show 14 days as before
                        date.setDate(date.getDate() - 7 + i); // Show 7 days before, today, and 6 days after
                      }
                      const isSelected = date.toDateString() === selectedDate.toDateString();
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <Button
                          key={i}
                          variant={isSelected ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedDate(new Date(date))}
                          className={cn(
                            // Mobile-first responsive sizing
                            "min-w-[2.75rem] w-11 h-11 md:min-w-[3rem] md:w-12 md:h-12",
                            // Layout and spacing  
                            "flex flex-col items-center justify-center p-0.5 md:p-1 shrink-0 transition-all",
                            // Touch-friendly on mobile
                            "touch-manipulation select-none",
                            // Conditional styling
                            isToday && !isSelected && "ring-2 ring-primary ring-offset-1",
                            isSelected && "shadow-sm"
                          )}
                          style={isSelected ? { backgroundColor: '#BCE7F0', color: '#000' } : {}}
                        >
                          <span className="text-[10px] md:text-xs font-normal leading-none">
                            {format(date, 'EEE')}
                          </span>
                          <span className="text-xs md:text-sm font-semibold leading-none mt-0.5">
                            {format(date, 'd')}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Arrow - Desktop Only */}
                {!isMobile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }}
                    className="shrink-0 h-9 w-9 md:h-8 md:w-8 touch-manipulation"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Calendar Picker Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    initialFocus
                    classNames={{
                      day_selected: "bg-[#BCE7F0] text-black hover:bg-[#BCE7F0] hover:text-black focus:bg-[#BCE7F0] focus:text-black",
                      day_today: "bg-[#F7F7F7] text-black"
                    }}
                  />
                </PopoverContent>
              </Popover>
              
              {/* Today Button - Hidden on Mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="shrink-0 hidden md:flex"
              >
                Today
              </Button>
            </div>
          </div>



          {/* Filter Tabs */}
          <Tabs defaultValue="all" value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as FilterType)} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({todaysDeliveries.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered ({deliveredCount})</TabsTrigger>
              <TabsTrigger value="missed">Missed ({missedCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {filteredDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center min-h-[300px]">
                  <div className="relative w-[140px] h-[140px] mb-6">
                    <Image
                      src="/images/dairy-delivery-empty.png"
                      alt="No deliveries"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-base font-medium mb-1">No deliveries found</h3>
                  <p className="text-sm text-muted-foreground">
                    No deliveries scheduled for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeliveries.map((routeItem) => (
                    <Card key={routeItem.customer.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getUserInitials(routeItem.customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{routeItem.customer.name}</CardTitle>
                              <CardDescription className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {routeItem.customer.location.address || 'No address'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => makeCall(routeItem.customer.mobile)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const address = routeItem.customer.location.address;
                                if (address) {
                                  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                                  window.open(url, '_blank');
                                }
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {routeItem.deliveries.map((delivery) => (
                            <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{delivery.product.name}</h4>
                                  {getStatusBadge(delivery.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {delivery.quantity} {delivery.product.unit} • ₹{delivery.amount}
                                </p>
                                {delivery.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Note: {delivery.notes}
                                  </p>
                                )}
                              </div>
                              
                              {delivery.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeliveryAction(delivery.id, 'missed')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Miss
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeliveryAction(delivery.id, 'delivered')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Deliver
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold">Total: ₹{routeItem.totalAmount}</span>
                            <Badge variant={
                              routeItem.status === 'completed' 
                                ? "success"
                                : routeItem.status === 'partial'
                                ? "warning" 
                                : "secondary"
                            }>
                              {routeItem.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {filteredDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center min-h-[300px]">
                  <div className="relative w-[140px] h-[140px] mb-6">
                    <Image
                      src="/images/dairy-delivery-empty.png"
                      alt="No deliveries"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-base font-medium mb-1">No pending deliveries</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending deliveries for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeliveries.map((routeItem) => (
                    <Card key={routeItem.customer.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getUserInitials(routeItem.customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{routeItem.customer.name}</CardTitle>
                              <CardDescription className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {routeItem.customer.location.address || 'No address'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => makeCall(routeItem.customer.mobile)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const address = routeItem.customer.location.address;
                                if (address) {
                                  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                                  window.open(url, '_blank');
                                }
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {routeItem.deliveries.map((delivery) => (
                            <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{delivery.product.name}</h4>
                                  {getStatusBadge(delivery.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {delivery.quantity} {delivery.product.unit} • ₹{delivery.amount}
                                </p>
                                {delivery.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Note: {delivery.notes}
                                  </p>
                                )}
                              </div>
                              
                              {delivery.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeliveryAction(delivery.id, 'missed')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Miss
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeliveryAction(delivery.id, 'delivered')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Deliver
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold">Total: ₹{routeItem.totalAmount}</span>
                            <Badge variant={
                              routeItem.status === 'completed' 
                                ? "success"
                                : routeItem.status === 'partial'
                                ? "warning" 
                                : "secondary"
                            }>
                              {routeItem.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="delivered">
              {filteredDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center min-h-[300px]">
                  <div className="relative w-[140px] h-[140px] mb-6">
                    <Image
                      src="/images/dairy-delivery-empty.png"
                      alt="No deliveries"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-base font-medium mb-1">No delivered orders</h3>
                  <p className="text-sm text-muted-foreground">
                    No delivered deliveries for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeliveries.map((routeItem) => (
                    <Card key={routeItem.customer.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getUserInitials(routeItem.customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{routeItem.customer.name}</CardTitle>
                              <CardDescription className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {routeItem.customer.location.address || 'No address'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => makeCall(routeItem.customer.mobile)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const address = routeItem.customer.location.address;
                                if (address) {
                                  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                                  window.open(url, '_blank');
                                }
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {routeItem.deliveries.map((delivery) => (
                            <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{delivery.product.name}</h4>
                                  {getStatusBadge(delivery.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {delivery.quantity} {delivery.product.unit} • ₹{delivery.amount}
                                </p>
                                {delivery.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Note: {delivery.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold">Total: ₹{routeItem.totalAmount}</span>
                            <Badge variant={
                              routeItem.status === 'completed' 
                                ? "success"
                                : routeItem.status === 'partial'
                                ? "warning" 
                                : "secondary"
                            }>
                              {routeItem.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="missed">
              {filteredDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center min-h-[300px]">
                  <div className="relative w-[140px] h-[140px] mb-6">
                    <Image
                      src="/images/dairy-delivery-empty.png"
                      alt="No deliveries"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-base font-medium mb-1">No missed deliveries</h3>
                  <p className="text-sm text-muted-foreground">
                    No missed deliveries for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeliveries.map((routeItem) => (
                    <Card key={routeItem.customer.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getUserInitials(routeItem.customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{routeItem.customer.name}</CardTitle>
                              <CardDescription className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {routeItem.customer.location.address || 'No address'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => makeCall(routeItem.customer.mobile)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const address = routeItem.customer.location.address;
                                if (address) {
                                  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                                  window.open(url, '_blank');
                                }
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {routeItem.deliveries.map((delivery) => (
                            <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{delivery.product.name}</h4>
                                  {getStatusBadge(delivery.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {delivery.quantity} {delivery.product.unit} • ₹{delivery.amount}
                                </p>
                                {delivery.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Note: {delivery.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold">Total: ₹{routeItem.totalAmount}</span>
                            <Badge variant={
                              routeItem.status === 'completed' 
                                ? "success"
                                : routeItem.status === 'partial'
                                ? "warning" 
                                : "secondary"
                            }>
                              {routeItem.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Missed Delivery Modal */}
          <Dialog open={missedModalOpen} onOpenChange={setMissedModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Mark as Missed</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reason for missing delivery</Label>
                  <Select
                    value={missedReason}
                    onValueChange={(value) => setMissedReason(value as MissedReason)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_available">Customer not available</SelectItem>
                      <SelectItem value="rejected">Customer rejected delivery</SelectItem>
                      <SelectItem value="pause">Customer wants to pause</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {missedReason === 'pause' && (
                  <div className="space-y-2">
                    <Label>Pause for how many days?</Label>
                    <Input
                      type="number"
                      value={pauseDays}
                      onChange={(e) => setPauseDays(e.target.value)}
                      placeholder="Number of days"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setMissedModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMissedSubmit} variant="destructive">
                    Mark as Missed
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </LayoutComponent>
    </ProtectedRoute>
  );
} 