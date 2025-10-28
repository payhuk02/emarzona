# 🚀 PLAN D'ACTION - OPTION B : PRODUCTION COMPLÈTE
**Date début** : 28 octobre 2025  
**Durée estimée** : 49 heures (~1 mois à mi-temps)  
**Objectif** : Plateforme 99% production-ready

---

## 📊 RÉSUMÉ EXÉCUTIF

**7 phases** à compléter :
1. ⚠️ Corrections critiques (14h)
2. 📄 Pages manquantes (6h)
3. 🎨 Améliorations UI (4h)
4. 🚚 Intégrations APIs (8h)
5. 📊 Dashboard & Outils (5h)
6. 🧪 Tests E2E (8h)
7. 📚 Documentation (4h)

**Total** : 49 heures

---

## PHASE 1 : CORRECTIONS CRITIQUES (14h) ⚠️ PRIORITÉ ABSOLUE

### 1.1 Digital Products - Wizard Sauvegarde (2h)
**Problème** : Wizard sauvegarde dans `products` au lieu de `digital_products`

**Fichier** : `src/components/products/create/digital/CreateDigitalProductWizard_v2.tsx`

**Actions** :
```typescript
// Corriger la fonction saveDigitalProduct
const saveDigitalProduct = async () => {
  try {
    // 1. Créer produit de base
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        store_id: storeId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: formData.price,
        product_type: 'digital',
        // ... autres champs de base
      })
      .select()
      .single();

    if (productError) throw productError;

    // 2. Créer dans digital_products
    const { error: digitalError } = await supabase
      .from('digital_products')
      .insert({
        product_id: product.id,
        digital_type: formData.digitalType,
        license_type: formData.licenseType,
        license_duration_days: formData.licenseDuration,
        max_activations: formData.maxActivations,
        main_file_url: formData.mainFileUrl,
        main_file_size_mb: formData.mainFileSize,
        main_file_format: formData.mainFileFormat,
        download_limit: formData.downloadLimit,
        download_expiry_days: formData.downloadExpiry,
        // ... tous les autres champs digital
      })
      .select()
      .single();

    if (digitalError) throw digitalError;

    // 3. Créer fichiers dans digital_product_files
    if (formData.files && formData.files.length > 0) {
      const filesData = formData.files.map(file => ({
        digital_product_id: digitalProduct.id,
        file_url: file.url,
        file_name: file.name,
        file_size_mb: file.size,
        file_type: file.type,
        is_main: file.isMain,
      }));

      await supabase.from('digital_product_files').insert(filesData);
    }

    toast({ title: 'Produit digital créé avec succès!' });
    onSuccess();
  } catch (error) {
    console.error('Error:', error);
    toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
  }
};
```

**Tests** :
- [ ] Créer produit digital test
- [ ] Vérifier table `digital_products` remplie
- [ ] Vérifier `digital_product_files` créés
- [ ] Vérifier affichage dans liste

---

### 1.2 Physical Products - Page Détail (3h)
**Fichier** : `src/pages/physical/PhysicalProductDetail.tsx`

**Structure** :
```tsx
import { useParams } from 'react-router-dom';
import { usePhysicalProducts } from '@/hooks/physical/usePhysicalProducts';
import { ProductImages } from '@/components/physical/ProductImages';
import { VariantSelector } from '@/components/physical/VariantSelector';
import { InventoryStockIndicator } from '@/components/physical/InventoryStockIndicator';
import { ShippingInfoDisplay } from '@/components/physical/ShippingInfoDisplay';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export default function PhysicalProductDetail() {
  const { productId } = useParams();
  const { data: product, isLoading } = usePhysicalProducts({ productId });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Images */}
        <div>
          <ProductImages images={product.images} />
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">{product.price} XOF</span>
            {product.promotional_price && (
              <span className="text-xl line-through text-gray-500">
                {product.promotional_price} XOF
              </span>
            )}
          </div>

          <InventoryStockIndicator stock={product.stock} />

          {product.variants && (
            <VariantSelector 
              variants={product.variants}
              onSelect={(variant) => setSelectedVariant(variant)}
            />
          )}

          <ShippingInfoDisplay productId={product.id} />

          <AddToCartButton 
            product={product}
            variant={selectedVariant}
          />

          <div className="prose">
            <h2>Description</h2>
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>

          <Separator />

          <ProductReviewsSummary productId={product.id} />
        </div>
      </div>
    </div>
  );
}
```

**Route** : Ajouter dans `src/App.tsx`
```tsx
<Route path="/physical/:productId" element={<PhysicalProductDetail />} />
```

---

### 1.3 Services - Page Détail (3h)
**Fichier** : `src/pages/service/ServiceDetail.tsx`

**Structure** :
```tsx
import { ServiceCalendar } from '@/components/service/ServiceCalendar';
import { TimeSlotPicker } from '@/components/service/TimeSlotPicker';
import { BookingForm } from '@/components/service/BookingForm';

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left & Center: Service Info */}
        <div className="lg:col-span-2 space-y-6">
          <img src={service.image_url} className="w-full rounded-lg" />
          
          <h1 className="text-3xl font-bold">{service.name}</h1>
          
          <div className="flex items-center gap-4">
            <Badge>{service.category}</Badge>
            <span>{service.duration} minutes</span>
            <span className="text-2xl font-bold">{service.price} XOF</span>
          </div>

          <div className="prose">
            {service.description}
          </div>

          {service.staff && (
            <StaffCard staff={service.staff} />
          )}

          <ProductReviewsSummary productId={service.id} />
        </div>

        {/* Right: Booking */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Réserver un créneau</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ServiceCalendar 
                serviceId={serviceId}
                onDateSelect={setSelectedDate}
              />

              {selectedDate && (
                <TimeSlotPicker 
                  serviceId={serviceId}
                  date={selectedDate}
                  onSlotSelect={setSelectedSlot}
                />
              )}

              {selectedSlot && (
                <BookingForm 
                  service={service}
                  date={selectedDate}
                  slot={selectedSlot}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

### 1.4 Services - Calendrier Moderne (4h)
**Améliorer** : `src/components/service/ServiceCalendar.tsx`

**Librairie** : Utiliser `react-big-calendar`

```bash
npm install react-big-calendar date-fns
```

**Implémentation** :
```tsx
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { fr },
});

export const ServiceCalendar = ({ serviceId, onDateSelect }) => {
  const { data: availabilities } = useAvailability(serviceId);
  const { data: bookings } = useBookings(serviceId);

  const events = [
    ...availabilities.map(a => ({
      title: 'Disponible',
      start: new Date(a.start_time),
      end: new Date(a.end_time),
      resource: { type: 'available', ...a },
    })),
    ...bookings.map(b => ({
      title: 'Réservé',
      start: new Date(b.start_time),
      end: new Date(b.end_time),
      resource: { type: 'booked', ...b },
    })),
  ];

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
      onSelectEvent={(event) => onDateSelect(event.start)}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: event.resource.type === 'available' ? '#10b981' : '#ef4444',
        },
      })}
      views={['month', 'week', 'day']}
      defaultView="week"
    />
  );
};
```

---

### 1.5 Payer le Solde - Page (2h)
**Fichier** : `src/pages/payments/PayBalance.tsx`

```tsx
export default function PayBalance() {
  const { orderId } = useParams();
  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const remainingAmount = order.remaining_amount;

  const handlePayBalance = async () => {
    const result = await initiateMonerooPayment({
      amount: remainingAmount,
      order_id: orderId,
      description: `Solde commande #${order.order_number}`,
      customer_email: order.customer_email,
      return_url: `${window.location.origin}/payments/success`,
      cancel_url: `${window.location.origin}/payments/cancel`,
      metadata: {
        order_id: orderId,
        payment_type: 'balance',
        initial_amount: order.total_amount,
        percentage_paid: order.percentage_paid,
      },
    });

    if (result.payment_url) {
      window.location.href = result.payment_url;
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Payer le solde</CardTitle>
          <CardDescription>
            Commande #{order.order_number}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Montant total :</span>
              <span className="font-bold">{order.total_amount} XOF</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>Acompte payé :</span>
              <span className="font-bold">-{order.percentage_paid} XOF</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span>Solde restant :</span>
              <span className="font-bold text-orange-600">
                {remainingAmount} XOF
              </span>
            </div>
          </div>

          <Button 
            onClick={handlePayBalance}
            className="w-full"
            size="lg"
          >
            Payer {remainingAmount} XOF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Route** : `src/App.tsx`
```tsx
<Route path="/payments/:orderId/balance" element={<PayBalance />} />
```

---

## PHASE 2 : PAGES MANQUANTES (6h)

Les 3 pages critiques sont déjà dans Phase 1.

**Pages supplémentaires** :
- ✅ PhysicalProductDetail (Phase 1.2)
- ✅ ServiceDetail (Phase 1.3)
- ✅ PayBalance (Phase 1.5)

---

## PHASE 3 : AMÉLIORATIONS UI (4h)

### 3.1 Calendrier Services (inclus Phase 1.4) ✅

### 3.2 ProductImages Component (2h)
**Fichier** : `src/components/physical/ProductImages.tsx`

```tsx
export const ProductImages = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
        <img 
          src={images[selectedImage]} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={cn(
                "aspect-square rounded border-2",
                selectedImage === idx ? "border-primary" : "border-gray-200"
              )}
            >
              <img src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3.3 StaffCard Component (2h)
**Fichier** : `src/components/service/StaffCard.tsx`

```tsx
export const StaffCard = ({ staff }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={staff.photo_url} />
            <AvatarFallback>{staff.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{staff.name}</p>
            <p className="text-sm text-muted-foreground">{staff.specialty}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{staff.bio}</p>
      </CardContent>
    </Card>
  );
};
```

---

## PHASE 4 : INTÉGRATIONS APIs (8h)

### 4.1 Shipping API - Fedex Integration (8h)
**Fichier** : `src/lib/shipping/fedex.ts`

```typescript
interface ShippingRateRequest {
  from_address: {
    postal_code: string;
    country_code: string;
  };
  to_address: {
    postal_code: string;
    country_code: string;
  };
  parcels: {
    weight: number; // kg
    length: number; // cm
    width: number;
    height: number;
  }[];
}

export const getFedexRates = async (request: ShippingRateRequest) => {
  const response = await fetch('https://apis.fedex.com/rate/v1/rates/quotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_FEDEX_API_KEY}`,
    },
    body: JSON.stringify({
      accountNumber: {
        value: import.meta.env.VITE_FEDEX_ACCOUNT_NUMBER,
      },
      requestedShipment: {
        shipper: request.from_address,
        recipient: request.to_address,
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        serviceType: 'FEDEX_GROUND',
        packagingType: 'YOUR_PACKAGING',
        requestedPackageLineItems: request.parcels.map(p => ({
          weight: {
            units: 'KG',
            value: p.weight,
          },
          dimensions: {
            length: p.length,
            width: p.width,
            height: p.height,
            units: 'CM',
          },
        })),
      },
    }),
  });

  const data = await response.json();
  
  return {
    rates: data.output.rateReplyDetails.map(r => ({
      service: r.serviceName,
      cost: r.ratedShipmentDetails[0].totalNetCharge,
      delivery_days: r.commit.dateDetail.dayOfWeek,
    })),
  };
};
```

**Hook** : `src/hooks/physical/useShippingRates.ts`
```typescript
export const useShippingRates = (productId: string, address: Address) => {
  return useQuery({
    queryKey: ['shipping-rates', productId, address],
    queryFn: async () => {
      const product = await getPhysicalProduct(productId);
      
      return await getFedexRates({
        from_address: product.warehouse_address,
        to_address: address,
        parcels: [{
          weight: product.weight_kg,
          length: product.length_cm,
          width: product.width_cm,
          height: product.height_cm,
        }],
      });
    },
    enabled: !!address.postal_code,
  });
};
```

**UI Component** : `src/components/physical/ShippingCalculator.tsx`
```tsx
export const ShippingCalculator = ({ productId }) => {
  const [address, setAddress] = useState({});
  const { data: rates, isLoading } = useShippingRates(productId, address);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculer les frais de livraison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Code postal"
          onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
        />
        
        {isLoading && <Loader2 className="animate-spin" />}
        
        {rates && (
          <div className="space-y-2">
            {rates.map(rate => (
              <div key={rate.service} className="flex justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{rate.service}</p>
                  <p className="text-sm text-muted-foreground">
                    Livraison: {rate.delivery_days}
                  </p>
                </div>
                <span className="font-bold">{rate.cost} XOF</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## PHASE 5 : DASHBOARD & OUTILS (5h)

### 5.1 Inventory Dashboard (5h)
**Fichier** : `src/pages/physical/InventoryDashboard.tsx`

```tsx
export default function InventoryDashboard() {
  const { data: products } = usePhysicalProducts();
  const { data: alerts } = useStockAlerts();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">Gestion Inventaire</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="Total Produits"
              value={products?.length || 0}
              icon={Package}
            />
            <StatsCard 
              title="Stock Bas"
              value={alerts?.length || 0}
              icon={AlertCircle}
              variant="warning"
            />
            <StatsCard 
              title="Rupture Stock"
              value={products?.filter(p => p.stock === 0).length || 0}
              icon={XCircle}
              variant="destructive"
            />
            <StatsCard 
              title="Valeur Totale"
              value={calculateTotalValue(products)}
              icon={DollarSign}
            />
          </div>

          {/* Alerts */}
          {alerts && alerts.length > 0 && (
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{alerts.length} alertes stock bas</AlertTitle>
              <AlertDescription>
                Certains produits nécessitent un réapprovisionnement
              </AlertDescription>
            </Alert>
          )}

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventaire</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => exportToCSV(products)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={inventoryColumns}
                data={products}
                searchKey="name"
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
```

---

## PHASE 6 : TESTS E2E (8h)

### 6.1 Setup Playwright (1h)
```bash
npm install -D @playwright/test
npx playwright install
```

**Config** : `playwright.config.ts`
```typescript
export default {
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
};
```

### 6.2 Tests Digital Products (2h)
**Fichier** : `e2e/digital-products.spec.ts`

```typescript
test.describe('Digital Products', () => {
  test('Create and purchase digital product', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    
    // Create product
    await page.goto('/products/create');
    await page.click('text=Produit Digital');
    await page.fill('[name=name]', 'Test Ebook');
    await page.fill('[name=price]', '5000');
    await page.click('text=Suivant'); // Next steps...
    
    // Verify in database
    const product = await page.evaluate(async () => {
      const { data } = await supabase
        .from('digital_products')
        .select('*')
        .eq('name', 'Test Ebook')
        .single();
      return data;
    });
    
    expect(product).toBeDefined();
    expect(product.product_id).toBeDefined();
  });
});
```

### 6.3 Tests Physical Products (2h)
### 6.4 Tests Services (2h)
### 6.5 Tests Advanced Payments (1h)

---

## PHASE 7 : DOCUMENTATION (4h)

### 7.1 Guide Utilisateur Vendeurs (2h)
**Fichier** : `docs/GUIDE_VENDEUR.md`

**Sections** :
- Créer produit digital
- Créer produit physique
- Créer service
- Gérer inventaire
- Gérer commandes
- Paiements avancés
- Analytics

### 7.2 Guide Utilisateur Clients (1h)
**Fichier** : `docs/GUIDE_CLIENT.md`

### 7.3 API Documentation (1h)
**Fichier** : `docs/API.md`

---

## 📊 TIMELINE & MILESTONES

### Semaine 1 (14h)
- ✅ Phase 1.1-1.3 : Corrections critiques
- ✅ Tests basiques

### Semaine 2 (14h)
- ✅ Phase 1.4-1.5 : Calendrier + Pay Balance
- ✅ Phase 3 : Améliorations UI

### Semaine 3 (14h)
- ✅ Phase 4 : Shipping API
- ✅ Phase 5 : Inventory Dashboard

### Semaine 4 (7h)
- ✅ Phase 6 : Tests E2E
- ✅ Phase 7 : Documentation
- ✅ Final review & deploy

---

## ✅ CHECKLIST FINALE

### Avant déploiement
- [ ] Tous les bugs critiques corrigés
- [ ] Pages manquantes créées
- [ ] Shipping API fonctionnel
- [ ] Tests E2E passent (90%+)
- [ ] Documentation complète
- [ ] Migration SQL appliquée
- [ ] Tests visuels OK
- [ ] 0 erreur linter
- [ ] Performance OK (Lighthouse 90+)

### Déploiement
- [ ] Deploy Vercel
- [ ] Vérifier prod
- [ ] Monitoring activé (Sentry)
- [ ] Analytics configurés
- [ ] Emails transactionnels testés

---

## 🎯 RÉSULTAT ATTENDU

**Après Option B** :
- ✅ 99% fonctionnel
- ✅ 0 bug critique
- ✅ Pages complètes
- ✅ Shipping intégré
- ✅ Tests E2E
- ✅ Documentation
- ✅ **Production Ready** 🚀

---

**Prochaine étape** : Commencer Phase 1.1 (Digital Wizard)

**Prêt à démarrer ?**

