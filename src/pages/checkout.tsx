import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { useCart } from '@/lib/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard as CardIcon
} from 'lucide-react';

export default function CheckoutPage() {
  const { language } = useLanguage();
  const translate = (bg: string, en: string) => language === 'bg' ? bg : en;
  const { cartItems, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  // Shipping cost calculation
  const shippingCost = subtotal > 50 ? 0 : 5;
  const tax = 0; // Assuming no tax for now
  const totalAmount = subtotal + shippingCost + tax;
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Bulgaria',
    notes: '',
    paymentMethod: 'cod' // Cash on delivery by default
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // If cart is empty, redirect to shop
  useEffect(() => {
    if (cartItems.length === 0 && !orderComplete) {
      router.push('/shop');
    }
  }, [cartItems, router, orderComplete]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle payment method selection
  const handlePaymentMethodChange = (value: string) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = translate('Това поле е задължително', 'This field is required');
    if (!formData.lastName.trim()) newErrors.lastName = translate('Това поле е задължително', 'This field is required');
    if (!formData.address.trim()) newErrors.address = translate('Това поле е задължително', 'This field is required');
    if (!formData.city.trim()) newErrors.city = translate('Това поле е задължително', 'This field is required');
    if (!formData.postalCode.trim()) newErrors.postalCode = translate('Това поле е задължително', 'This field is required');
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = translate('Това поле е задължително', 'This field is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = translate('Невалиден имейл адрес', 'Invalid email address');
    }
    
    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = translate('Невалиден телефонен номер', 'Invalid phone number');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: translate('Грешка във формата', 'Form Error'),
        description: translate('Моля, попълнете всички задължителни полета правилно', 'Please fill in all required fields correctly'),
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setOrderError(null);
    
    try {
      // Prepare the order data
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        shipping: {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country
        },
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          type: item.type || 'book'
        })),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        subtotal,
        shippingCost,
        tax,
        totalAmount
      };
      
      // Submit the order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process order');
      }
      
      const result = await response.json();
      
      // Order successful
      setOrderId(result.orderId);
      setOrderComplete(true);
      clearCart();
      
      toast({
        title: translate('Поръчката е успешна!', 'Order Successful!'),
        description: translate(`Поръчка #${result.orderId} е приета`, `Order #${result.orderId} has been placed`),
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Checkout error:', error);
      setOrderError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: translate('Грешка при поръчката', 'Order Error'),
        description: error instanceof Error ? error.message : translate('Възникна неизвестна грешка', 'An unknown error occurred'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render order success page
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12">
        <Head>
          <title>{translate("Поръчка успешна", "Order Successful")} | Elis Author</title>
          <meta 
            name="description" 
            content={translate(
              "Вашата поръчка беше успешно приета",
              "Your order has been successfully placed"
            )} 
          />
        </Head>

        <div className="container max-w-4xl mx-auto px-4">
          {/* Success Message Card */}
          <Card className="border-border/40 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-8">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-green-500/10 p-3 ring-8 ring-green-500/5">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-medium">
                {translate("Поръчката е успешна!", "Order Successful!")}
              </h1>
              <p className="mb-6 text-muted-foreground">
                {translate(
                  "Благодарим ви за поръчката. Номерът на вашата поръчка е:",
                  "Thank you for your order. Your order number is:"
                )}
              </p>
              <div className="mb-8">
                <Badge variant="outline" className="rounded-full px-4 py-1 text-lg font-medium">
                  {orderId}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Order Details Card */}
          <Card className="border-border/40 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-8">
            <CardHeader>
              <CardTitle>{translate("Детайли на поръчката", "Order Details")}</CardTitle>
              <CardDescription>
                {translate(
                  "Преглед на вашата поръчка и информация за доставка",
                  "Review your order and delivery information"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    {translate("Поръчани продукти", "Ordered Items")}
                  </h3>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="relative aspect-[3/4] w-16 overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                          <Image
                            src={item.coverImage || item.image || "/placeholder.jpg"}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                          {item.type === 'service' && (
                            <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {item.type === 'book' && item.itemData?.digital && (
                            <div className="absolute inset-0 bg-green-500/10 backdrop-blur-sm flex items-center justify-center">
                              <Download className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium leading-tight mb-1">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge 
                              variant="secondary" 
                              className="rounded-full px-2 py-0.5 text-xs bg-muted"
                            >
                              {item.type === 'book' 
                                ? translate("Книга", "Book")
                                : translate("Услуга", "Service")
                              }
                            </Badge>
                            <span>x{item.quantity}</span>
                            <span>•</span>
                            <span>{(item.price * item.quantity).toFixed(2)} BGN</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Delivery Information */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      {translate("Информация за доставка", "Delivery Information")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {translate(
                            "Очаквана доставка: 2-4 работни дни",
                            "Expected delivery: 2-4 business days"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formData.address}, {formData.city}, {formData.postalCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{formData.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      {translate("Информация за плащане", "Payment Information")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CardIcon className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {translate(
                            formData.paymentMethod === 'cod' ? "Наложен платеж" : "Карта",
                            formData.paymentMethod === 'cod' ? "Cash on Delivery" : "Credit Card"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formData.firstName} {formData.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{formData.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    {translate("Обобщение на поръчката", "Order Summary")}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {translate("Междинна сума", "Subtotal")}
                      </span>
                      <span>{subtotal.toFixed(2)} BGN</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {translate("Доставка", "Shipping")}
                      </span>
                      <span>
                        {shippingCost === 0 
                          ? translate("Безплатна", "Free")
                          : `${shippingCost.toFixed(2)} BGN`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {translate("Данък", "Tax")}
                      </span>
                      <span>{tax.toFixed(2)} BGN</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-medium">
                      <span>{translate("Общо", "Total")}</span>
                      <span>{totalAmount.toFixed(2)} BGN</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Support Card */}
          <Card className="border-border/40 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-8">
            <CardHeader>
              <CardTitle>
                {translate("Връзка с нас", "Contact & Support")}
              </CardTitle>
              <CardDescription>
                {translate(
                  "Имате въпроси? Свържете се с нас",
                  "Have questions? Get in touch with us"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    {translate("Контакти", "Contact Information")}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href="mailto:support@elis-author.com"
                        className="hover:text-primary transition-colors"
                      >
                        support@elis-author.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href="tel:+359888123456"
                        className="hover:text-primary transition-colors"
                      >
                        +359 888 123 456
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href="https://elis-author.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        elis-author.com
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    {translate("Социални мрежи", "Social Media")}
                  </h3>
                  <div className="flex gap-4">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-2 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                      </svg>
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-2 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-2 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/shop')}
              variant="outline"
              className="gap-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              {translate("Обратно към магазина", "Back to Shop")}
            </Button>
            <Button
              onClick={() => router.push('/account/orders')}
              variant="outline"
              className="gap-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors duration-300"
            >
              <Clock className="h-4 w-4" />
              {translate("Проследи поръчката", "Track Order")}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Head>
        <title>{translate("Плащане", "Checkout")} | Author Name</title>
      </Head>

      <div className="container h-screen flex flex-col">
        {/* Header */}
        <div className="py-4 flex items-center justify-between border-b border-border/40">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            {translate("Обратно", "Back")}
          </Button>
          <h1 className="text-xl font-medium">
            {translate("Завърши поръчката", "Complete Order")}
          </h1>
          <div className="w-[100px]" /> {/* Spacer for alignment */}
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-[1fr,400px] gap-6 py-6 h-[calc(100vh-80px)] overflow-hidden">
          {/* Form Section */}
          <div className="overflow-y-auto pr-6 space-y-6">
            {/* Personal Information */}
            <Card className="border-border/40 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{translate("Лични данни", "Personal Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{translate("Име", "First Name")}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="rounded-lg border-border/40 bg-card/50"
                      placeholder={translate("Вашето име", "Your first name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{translate("Фамилия", "Last Name")}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="rounded-lg border-border/40 bg-card/50"
                      placeholder={translate("Вашата фамилия", "Your last name")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{translate("Имейл", "Email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="rounded-lg border-border/40 bg-card/50"
                      placeholder={translate("вашият@имейл.com", "your@email.com")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{translate("Телефон", "Phone")}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="rounded-lg border-border/40 bg-card/50"
                      placeholder="+359"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card className="border-border/40 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{translate("Адрес за доставка", "Shipping Address")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">{translate("Адрес", "Address")}</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="rounded-lg border-border/40 bg-card/50"
                    placeholder={translate("Улица и номер", "Street address")}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{translate("Град", "City")}</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="rounded-lg border-border/40 bg-card/50"
                      placeholder={translate("Вашият град", "Your city")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{translate("Пощ. код", "Postal Code")}</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="rounded-lg border-border/40 bg-card/50"
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{translate("Държава", "Country")}</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="rounded-lg border-border/40 bg-card/50"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{translate("Бележки", "Notes")}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="rounded-lg border-border/40 bg-card/50 min-h-[80px]"
                    placeholder={translate(
                      "Допълнителни инструкции за доставка...",
                      "Additional delivery instructions..."
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-border/40 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{translate("Начин на плащане", "Payment Method")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="cod"
                      id="cod"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="cod"
                      className="flex items-center gap-3 rounded-lg border border-border/40 p-4 hover:bg-muted/50 peer-checked:border-primary [&:has([data-state=checked])]:border-primary h-full"
                    >
                      <div className="rounded-full bg-primary/10 p-2">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {translate("Наложен платеж", "Cash on Delivery")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {translate(
                            "Плащане при доставка",
                            "Pay when you receive"
                          )}
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="card"
                      id="card"
                      className="peer sr-only"
                      disabled
                    />
                    <Label
                      htmlFor="card"
                      className="flex items-center gap-3 rounded-lg border border-border/40 p-4 hover:bg-muted/50 peer-checked:border-primary [&:has([data-state=checked])]:border-primary opacity-50 h-full"
                    >
                      <div className="rounded-full bg-primary/10 p-2">
                        <CardIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {translate("Карта", "Credit Card")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {translate(
                            "Очаквайте скоро",
                            "Coming soon"
                          )}
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="border-l border-border/40 pl-6">
            <div className="sticky top-6 space-y-6">
              <Card className="border-border/40 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{translate("Вашата поръчка", "Your Order")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <div className="space-y-4 pr-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="relative aspect-[3/4] w-16 overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                            <Image
                              src={item.coverImage || item.image || "/placeholder.jpg"}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                            {item.type === 'service' && (
                              <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
                                <Clock className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                            {item.type === 'book' && item.itemData?.digital && (
                              <div className="absolute inset-0 bg-green-500/10 backdrop-blur-sm flex items-center justify-center">
                                <Download className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium leading-tight mb-1">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge 
                                variant="secondary" 
                                className="rounded-full px-2 py-0.5 text-xs bg-muted"
                              >
                                {item.type === 'book' 
                                  ? translate("Книга", "Book")
                                  : translate("Услуга", "Service")
                                }
                              </Badge>
                              <span>x{item.quantity}</span>
                            </div>
                            <div className="mt-1 font-medium">
                              {(item.price * item.quantity).toFixed(2)} BGN
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {translate("Междинна сума", "Subtotal")}
                      </span>
                      <span>{subtotal.toFixed(2)} BGN</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {translate("Доставка", "Shipping")}
                      </span>
                      <span>
                        {shippingCost === 0 
                          ? translate("Безплатна", "Free")
                          : `${shippingCost.toFixed(2)} BGN`
                        }
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-medium">
                      <span>{translate("Общо", "Total")}</span>
                      <span>{totalAmount.toFixed(2)} BGN</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {translate("Обработка...", "Processing...")}
                  </>
                ) : (
                  <>
                    {translate("Завърши поръчката", "Complete Order")}
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </>
                )}
              </Button>

              {orderError && (
                <div className="p-3 rounded-full bg-destructive/10 text-destructive text-sm text-center">
                  {orderError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 