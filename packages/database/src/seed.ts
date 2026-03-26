import bcrypt from 'bcryptjs'
import { PrismaClient, AdminRole, StoreStatus, ProductStatus, CartMode, PaymentMethodType, PromotionType, PromotionTarget } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .trim()
}

// ---------------------------------------------------------------------------
// 1. Admin user
// ---------------------------------------------------------------------------

async function seedAdminUser() {
  console.log('[seed] Creating default admin user...')

  const email = process.env.ADMIN_DEFAULT_EMAIL ?? 'admin@example.com'
  const password = process.env.ADMIN_DEFAULT_PASSWORD ?? 'changeme123'
  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: AdminRole.SUPERADMIN },
    create: {
      email,
      name: 'Super Admin',
      passwordHash,
      role: AdminRole.SUPERADMIN,
      isActive: true,
    },
  })

  console.log(`[seed] Admin user ready: ${admin.email} (role: ${admin.role})`)
  return admin
}

// ---------------------------------------------------------------------------
// 2. Stores
// ---------------------------------------------------------------------------

async function seedStores() {
  console.log('[seed] Creating demo stores...')

  const techHaven = await prisma.store.upsert({
    where: { slug: 'tech-haven' },
    update: { status: StoreStatus.ACTIVE },
    create: {
      name: 'Tech Haven',
      slug: 'tech-haven',
      status: StoreStatus.ACTIVE,
      description: 'Your one-stop shop for the latest tech gadgets and accessories.',
      sortOrder: 1,
    },
  })

  const fashionStudio = await prisma.store.upsert({
    where: { slug: 'fashion-studio' },
    update: { status: StoreStatus.ACTIVE },
    create: {
      name: 'Fashion Studio',
      slug: 'fashion-studio',
      status: StoreStatus.ACTIVE,
      description: 'Curated fashion and apparel for the modern lifestyle.',
      sortOrder: 2,
    },
  })

  console.log(`[seed] Stores ready: "${techHaven.name}", "${fashionStudio.name}"`)
  return { techHaven, fashionStudio }
}

// ---------------------------------------------------------------------------
// 3. Tech Haven — StoreConfig
// ---------------------------------------------------------------------------

async function seedTechHavenConfig(storeId: string) {
  console.log('[seed] Creating Tech Haven store config...')

  const config = await prisma.storeConfig.upsert({
    where: { storeId },
    update: {},
    create: {
      storeId,
      // Branding — blue/tech palette
      primaryColor: '#0F172A',
      secondaryColor: '#475569',
      accentColor: '#2563EB',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F8FAFC',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      borderRadius: 'lg',
      // Commerce
      currency: 'USD',
      currencySymbol: '$',
      currencyPosition: 'before',
      currencyDecimals: 2,
      language: 'en',
      country: 'US',
      timezone: 'America/New_York',
      weightUnit: 'kg',
      dimensionUnit: 'cm',
      // SEO
      metaTitle: 'Tech Haven — Premium Tech Gadgets & Accessories',
      metaDescription: 'Shop the latest headphones, keyboards, hubs, webcams and more at Tech Haven. Free shipping on orders over $50.',
      metaKeywords: 'tech gadgets, electronics, headphones, keyboard, accessories',
      // Contact
      contactEmail: 'hello@techhaven.example.com',
      contactPhone: '+1 (555) 010-2030',
      address: {
        street: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'US',
      },
      // Social
      socialLinks: {
        twitter: 'https://twitter.com/techhaven',
        instagram: 'https://instagram.com/techhaven',
        youtube: 'https://youtube.com/@techhaven',
      },
      // Checkout
      checkoutConfig: {
        guestCheckout: true,
        requirePhone: false,
        requireCompany: false,
        termsUrl: '/terms',
        privacyUrl: '/privacy',
        confirmationMessage: 'Thank you for your order! We will process it shortly.',
      },
      emailFromName: 'Tech Haven',
      emailFromAddress: 'orders@techhaven.example.com',
      emailReplyTo: 'support@techhaven.example.com',
    },
  })

  console.log('[seed] Tech Haven config ready.')
  return config
}

// ---------------------------------------------------------------------------
// 4. Tech Haven — StoreTheme
// ---------------------------------------------------------------------------

async function seedTechHavenTheme(storeId: string) {
  console.log('[seed] Creating Tech Haven theme...')

  const theme = await prisma.storeTheme.upsert({
    where: { storeId },
    update: {},
    create: {
      storeId,
      presetName: 'default',
      // Product card
      cardStyle: 'standard',
      cardShowRating: false,
      cardShowBadges: true,
      cardShowQuickAdd: true,
      cardImageRatio: '1:1',
      cardHoverEffect: 'zoom',
      cardPricePosition: 'below',
      // Header
      headerStyle: 'standard',
      headerSticky: true,
      headerShowSearch: true,
      headerShowCart: true,
      headerLogoMaxHeight: 48,
      headerNavLayout: 'horizontal',
      // Footer
      footerStyle: 'standard',
      footerColumns: [
        {
          title: 'Shop',
          links: [
            { label: 'All Products', url: '/products' },
            { label: 'Electronics', url: '/categories/electronics' },
            { label: 'Accessories', url: '/categories/accessories' },
          ],
        },
        {
          title: 'Support',
          links: [
            { label: 'FAQ', url: '/faq' },
            { label: 'Shipping Policy', url: '/shipping' },
            { label: 'Returns', url: '/returns' },
            { label: 'Contact Us', url: '/contact' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About Us', url: '/about' },
            { label: 'Blog', url: '/blog' },
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
          ],
        },
      ],
      // Buttons
      buttonStyle: 'filled',
      buttonRadius: 'lg',
      // Listing
      listingDefaultView: 'grid',
      listingColumns: 3,
      listingShowFilters: true,
      listingShowSort: true,
      listingShowCount: true,
      // PDP
      pdpLayout: 'standard',
      pdpShowRelated: true,
      pdpRelatedCount: 4,
      pdpImageLayout: 'gallery',
      pdpShowShare: false,
      pdpShowSku: true,
      pdpShowStock: true,
      // Price
      priceShowOriginal: true,
      priceShowSavings: true,
      priceShowSavingsPct: true,
      priceColorDiscount: '#DC2626',
      priceColorOriginal: '#94A3B8',
    },
  })

  console.log('[seed] Tech Haven theme ready.')
  return theme
}

// ---------------------------------------------------------------------------
// 5. Tech Haven — CartConfig
// ---------------------------------------------------------------------------

async function seedTechHavenCartConfig(storeId: string) {
  console.log('[seed] Creating Tech Haven cart config...')

  const cartConfig = await prisma.cartConfig.upsert({
    where: { storeId },
    update: {},
    create: {
      storeId,
      mode: CartMode.DRAWER,
      style: 'standard',
      position: 'right',
      size: 'md',
      showImages: true,
      showVariantOptions: true,
      showQuantity: true,
      showRemove: true,
      showSubtotal: true,
      showSavings: true,
      showItemCount: true,
      showShipping: false,
      showTaxes: false,
      showPromoCode: true,
      showProgress: true,
      freeShippingThreshold: 50.00,
      showUpsells: false,
      showCrossSells: false,
      cartTitle: 'Your Cart',
      emptyTitle: 'Your cart is empty',
      emptyMessage: 'Looks like you haven\'t added anything yet. Start exploring our tech collection!',
      checkoutButtonText: 'Proceed to Checkout',
      continueShoppingText: 'Continue Shopping',
      orderSummaryTitle: 'Order Summary',
      persistDays: 7,
      styleTokens: {
        backgroundColor: '#FFFFFF',
        headerBg: '#F8FAFC',
        itemBg: '#FFFFFF',
        borderColor: '#E2E8F0',
        fontFamily: 'Inter',
        titleFontSize: '1.125rem',
        subtotalFontWeight: '700',
        checkoutButtonBg: '#2563EB',
        checkoutButtonColor: '#FFFFFF',
        checkoutButtonRadius: '0.5rem',
        checkoutButtonFontWeight: '600',
        itemImageRadius: '0.5rem',
        quantityStyle: 'stepper',
      },
      triggerConfig: {
        openOnAdd: true,
        closeOnOutsideClick: true,
        showOverlay: true,
        animationStyle: 'slide',
      },
    },
  })

  console.log('[seed] Tech Haven cart config ready.')
  return cartConfig
}

// ---------------------------------------------------------------------------
// 6. Categories
// ---------------------------------------------------------------------------

async function seedCategories(storeId: string) {
  console.log('[seed] Creating categories...')

  const categoriesData = [
    {
      slug: 'electronics',
      name: 'Electronics',
      description: 'Core electronic devices and tech gear.',
      sortOrder: 1,
    },
    {
      slug: 'accessories',
      name: 'Accessories',
      description: 'Add-ons and peripherals to enhance your setup.',
      sortOrder: 2,
    },
    {
      slug: 'featured',
      name: 'Featured',
      description: 'Hand-picked featured products.',
      sortOrder: 3,
    },
  ]

  const categories: Record<string, { id: string; name: string; slug: string }> = {}

  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { storeId_slug: { storeId, slug: cat.slug } },
      update: { name: cat.name, description: cat.description },
      create: {
        storeId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    })
    categories[cat.slug] = record
  }

  console.log(`[seed] Categories ready: ${Object.keys(categories).join(', ')}`)
  return categories
}

// ---------------------------------------------------------------------------
// 7. Products
// ---------------------------------------------------------------------------

interface ProductSeed {
  name: string
  slug: string
  description: string
  shortDescription: string
  sku: string
  basePrice: number
  compareAtPrice?: number
  costPrice: number
  inventoryCount: number
  lowStockThreshold: number
  weight: number
  featured: boolean
  badgeLabel?: string
  badgeColor?: string
  tags: string[]
  attributes: { name: string; value: string }[]
  categorySlug: string
}

const TECH_PRODUCTS: ProductSeed[] = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    slug: 'wireless-noise-cancelling-headphones',
    description: `<p>Experience studio-quality sound with our flagship wireless headphones. Featuring active noise cancellation powered by adaptive algorithms, 30-hour battery life, and premium leather ear cushions for all-day comfort.</p>
<ul>
  <li>Active Noise Cancellation (ANC) with 3 modes</li>
  <li>30-hour battery life with quick-charge (10 min = 3 hrs)</li>
  <li>Bluetooth 5.3 with multipoint connection (2 devices)</li>
  <li>Hi-Res Audio certified — 40mm dynamic drivers</li>
  <li>Built-in voice assistant support</li>
  <li>Foldable design with premium carry case</li>
</ul>`,
    shortDescription: 'Studio-quality ANC headphones with 30-hour battery and Bluetooth 5.3.',
    sku: 'TH-HP-001',
    basePrice: 249.99,
    compareAtPrice: 319.99,
    costPrice: 110.00,
    inventoryCount: 85,
    lowStockThreshold: 10,
    weight: 0.29,
    featured: true,
    badgeLabel: 'Best Seller',
    badgeColor: '#2563EB',
    tags: ['headphones', 'wireless', 'anc', 'audio'],
    attributes: [
      { name: 'Connectivity', value: 'Bluetooth 5.3' },
      { name: 'Battery Life', value: '30 hours' },
      { name: 'Driver Size', value: '40mm' },
      { name: 'Weight', value: '290g' },
      { name: 'Foldable', value: 'Yes' },
    ],
    categorySlug: 'electronics',
  },
  {
    name: 'Mechanical Gaming Keyboard TKL',
    slug: 'mechanical-gaming-keyboard-tkl',
    description: `<p>Level up your typing and gaming with this tenkeyless mechanical keyboard. Featuring hot-swappable switches, per-key RGB lighting, and an aluminum top case for a premium feel.</p>
<ul>
  <li>Hot-swappable PCB — switch without soldering</li>
  <li>Per-key RGB backlight with 20+ effects</li>
  <li>Aluminum top case with CNC-machined finish</li>
  <li>N-Key rollover and anti-ghosting</li>
  <li>Available with Red (linear), Brown (tactile), or Blue (clicky) switches</li>
  <li>USB-C detachable braided cable</li>
  <li>Compatible with Windows and macOS</li>
</ul>`,
    shortDescription: 'Hot-swappable TKL mechanical keyboard with RGB and aluminum build.',
    sku: 'TH-KB-002',
    basePrice: 129.99,
    compareAtPrice: 159.99,
    costPrice: 55.00,
    inventoryCount: 120,
    lowStockThreshold: 15,
    weight: 0.87,
    featured: true,
    badgeLabel: 'New',
    badgeColor: '#059669',
    tags: ['keyboard', 'mechanical', 'gaming', 'rgb', 'tkl'],
    attributes: [
      { name: 'Layout', value: 'TKL (80%)' },
      { name: 'Switch Type', value: 'Hot-swappable' },
      { name: 'Lighting', value: 'Per-key RGB' },
      { name: 'Case Material', value: 'Aluminum' },
      { name: 'Connection', value: 'USB-C' },
    ],
    categorySlug: 'electronics',
  },
  {
    name: '12-in-1 USB-C Hub',
    slug: '12-in-1-usb-c-hub',
    description: `<p>Expand your laptop's connectivity with this compact yet powerful 12-in-1 USB-C hub. Supports 4K HDMI output, 100W PD charging, and multiple USB-A/C ports — all from a single USB-C connection.</p>
<ul>
  <li>4K@60Hz HDMI + 1080p VGA outputs</li>
  <li>100W USB-C Power Delivery pass-through</li>
  <li>3× USB-A 3.0 (5Gbps) + 1× USB-C 3.0 data</li>
  <li>SD and microSD card readers (UHS-I)</li>
  <li>3.5mm audio jack</li>
  <li>Gigabit Ethernet (RJ45)</li>
  <li>Plug-and-play — no drivers needed</li>
</ul>`,
    shortDescription: '12-in-1 USB-C hub with 4K HDMI, 100W PD, Ethernet and SD card slots.',
    sku: 'TH-HB-003',
    basePrice: 59.99,
    compareAtPrice: 79.99,
    costPrice: 22.00,
    inventoryCount: 200,
    lowStockThreshold: 20,
    weight: 0.12,
    featured: false,
    tags: ['usb-c', 'hub', 'adapter', 'hdmi', 'ethernet'],
    attributes: [
      { name: 'Ports', value: '12' },
      { name: 'HDMI', value: '4K@60Hz' },
      { name: 'Power Delivery', value: '100W' },
      { name: 'Ethernet', value: 'Gigabit' },
      { name: 'Compatibility', value: 'USB-C laptops / tablets' },
    ],
    categorySlug: 'accessories',
  },
  {
    name: '4K Streaming Webcam',
    slug: '4k-streaming-webcam',
    description: `<p>Look your best in every video call and stream with this 4K UHD webcam. Featuring auto-focus with face tracking, dual noise-cancelling microphones, and HDR support for bright backgrounds.</p>
<ul>
  <li>4K UHD 30fps / 1080p 60fps video</li>
  <li>Autofocus with AI face tracking</li>
  <li>HDR for challenging lighting environments</li>
  <li>Dual stereo noise-cancelling microphones</li>
  <li>90° field of view with 5× digital zoom</li>
  <li>Works with Zoom, Teams, OBS, and more</li>
  <li>Universal clip + tripod mount</li>
</ul>`,
    shortDescription: '4K HDR webcam with AI face tracking and dual noise-cancelling mics.',
    sku: 'TH-WC-004',
    basePrice: 149.99,
    compareAtPrice: 199.99,
    costPrice: 65.00,
    inventoryCount: 60,
    lowStockThreshold: 8,
    weight: 0.15,
    featured: true,
    badgeLabel: 'Hot',
    badgeColor: '#DC2626',
    tags: ['webcam', '4k', 'streaming', 'video-call', 'microphone'],
    attributes: [
      { name: 'Resolution', value: '4K UHD (3840×2160)' },
      { name: 'Frame Rate', value: '30fps @ 4K / 60fps @ 1080p' },
      { name: 'Field of View', value: '90°' },
      { name: 'Microphone', value: 'Dual stereo noise-cancelling' },
      { name: 'Connection', value: 'USB-A / USB-C' },
    ],
    categorySlug: 'electronics',
  },
  {
    name: 'Ergonomic Wireless Mouse',
    slug: 'ergonomic-wireless-mouse',
    description: `<p>Designed for long work sessions, this ergonomic wireless mouse reduces wrist strain with a sculpted right-hand shape, thumb rest, and adjustable DPI from 400 to 4000.</p>
<ul>
  <li>Ergonomic sculpted design with thumb rest</li>
  <li>Adjustable DPI: 400 / 800 / 1600 / 3200 / 4000</li>
  <li>Bluetooth 5.0 + 2.4GHz USB nano-receiver</li>
  <li>Connect up to 3 devices — easy switch button</li>
  <li>60-day battery life on a single AA battery</li>
  <li>Silent click buttons (75% quieter)</li>
  <li>6 programmable buttons</li>
</ul>`,
    shortDescription: 'Ergonomic wireless mouse with silent clicks, 60-day battery, and 3-device pairing.',
    sku: 'TH-MS-005',
    basePrice: 49.99,
    compareAtPrice: 64.99,
    costPrice: 18.00,
    inventoryCount: 175,
    lowStockThreshold: 20,
    weight: 0.10,
    featured: false,
    tags: ['mouse', 'wireless', 'ergonomic', 'silent', 'bluetooth'],
    attributes: [
      { name: 'DPI Range', value: '400 – 4000' },
      { name: 'Connectivity', value: 'Bluetooth 5.0 + 2.4GHz' },
      { name: 'Battery Life', value: '60 days (1× AA)' },
      { name: 'Buttons', value: '6 programmable' },
      { name: 'Hand Orientation', value: 'Right-handed' },
    ],
    categorySlug: 'accessories',
  },
]

async function seedProducts(
  storeId: string,
  categories: Record<string, { id: string }>
) {
  console.log('[seed] Creating products...')

  const createdProducts: { id: string; name: string; slug: string; categorySlug: string }[] = []

  for (const [index, p] of TECH_PRODUCTS.entries()) {
    const product = await prisma.product.upsert({
      where: { storeId_slug: { storeId, slug: p.slug } },
      update: {
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        status: ProductStatus.ACTIVE,
        featured: p.featured,
      },
      create: {
        storeId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        sku: p.sku,
        status: ProductStatus.ACTIVE,
        featured: p.featured,
        isDigital: false,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        costPrice: p.costPrice,
        trackInventory: true,
        inventoryCount: p.inventoryCount,
        lowStockThreshold: p.lowStockThreshold,
        allowBackorder: false,
        weight: p.weight,
        hasVariants: false,
        badgeLabel: p.badgeLabel ?? null,
        badgeColor: p.badgeColor ?? null,
        sortOrder: index,
        publishedAt: new Date(),
        tags: p.tags,
        metaTitle: p.name,
        metaDescription: p.shortDescription,
      },
    })

    // Attributes — delete and recreate to keep seed idempotent
    await prisma.productAttribute.deleteMany({ where: { productId: product.id } })
    if (p.attributes.length > 0) {
      await prisma.productAttribute.createMany({
        data: p.attributes.map((attr, i) => ({
          productId: product.id,
          name: attr.name,
          value: attr.value,
          isVisible: true,
          sortOrder: i,
        })),
      })
    }

    // Category assignment
    const categoryId = categories[p.categorySlug]?.id
    if (categoryId) {
      await prisma.categoriesOnProducts.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId } },
        update: {},
        create: { productId: product.id, categoryId, sortOrder: index },
      })
    }

    // Assign featured products to "featured" category
    if (p.featured && categories['featured']) {
      await prisma.categoriesOnProducts.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: categories['featured'].id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          categoryId: categories['featured'].id,
          sortOrder: index,
        },
      })
    }

    createdProducts.push({ id: product.id, name: product.name, slug: product.slug, categorySlug: p.categorySlug })
    console.log(`[seed]   Product created: "${product.name}" (${product.sku ?? product.slug})`)
  }

  console.log(`[seed] ${createdProducts.length} products ready.`)
  return createdProducts
}

// ---------------------------------------------------------------------------
// 8. Promotion — 10% off all products
// ---------------------------------------------------------------------------

async function seedPromotion(storeId: string) {
  console.log('[seed] Creating active promotion (10% off all)...')

  const existing = await prisma.promotion.findFirst({
    where: { storeId, name: 'Summer Tech Sale — 10% Off Everything' },
  })

  const promotion = existing
    ? await prisma.promotion.update({
        where: { id: existing.id },
        data: { isActive: true },
      })
    : await prisma.promotion.create({
        data: {
          storeId,
          name: 'Summer Tech Sale — 10% Off Everything',
          description: '10% discount applied automatically on all products, no code required.',
          internalNote: 'Seed promotion — disable when no longer needed.',
          type: PromotionType.PERCENTAGE_DISCOUNT,
          target: PromotionTarget.ALL,
          discountValue: 10.00,
          maxDiscountAmount: 50.00,
          isAutoApply: true,
          priority: 1,
          isStackable: false,
          badgeLabel: '10% OFF',
          badgeColor: '#2563EB',
          badgeTextColor: '#FFFFFF',
          isActive: true,
          currentUses: 0,
        },
      })

  console.log(`[seed] Promotion ready: "${promotion.name}"`)
  return promotion
}

// ---------------------------------------------------------------------------
// 9. Coupon — WELCOME10
// ---------------------------------------------------------------------------

async function seedCoupon(storeId: string, promotionId: string) {
  console.log('[seed] Creating coupon WELCOME10...')

  const coupon = await prisma.coupon.upsert({
    where: { storeId_code: { storeId, code: 'WELCOME10' } },
    update: { isActive: true },
    create: {
      storeId,
      code: 'WELCOME10',
      promotionId,
      target: PromotionTarget.ALL,
      minOrderAmount: 30.00,
      maxDiscountAmount: 30.00,
      maxUses: 1000,
      currentUses: 0,
      maxUsesPerUser: 1,
      isActive: true,
    },
  })

  console.log(`[seed] Coupon ready: "${coupon.code}"`)
  return coupon
}

// ---------------------------------------------------------------------------
// 10. Payment Methods
// ---------------------------------------------------------------------------

async function seedPaymentMethods(storeId: string) {
  console.log('[seed] Creating payment methods...')

  const methods = [
    {
      name: 'Bank Transfer',
      description: 'Pay directly to our bank account. Order will be processed after payment confirmation.',
      type: PaymentMethodType.BANK_TRANSFER,
      instructions: `
        <p><strong>Please transfer to the following account:</strong></p>
        <ul>
          <li><strong>Bank:</strong> First National Bank</li>
          <li><strong>Account Name:</strong> Tech Haven LLC</li>
          <li><strong>Account Number:</strong> 1234-5678-9012</li>
          <li><strong>Routing Number:</strong> 021000021</li>
          <li><strong>Reference:</strong> Your order number</li>
        </ul>
        <p>Orders are processed within 1–2 business days after payment is confirmed.</p>
      `,
      sortOrder: 1,
    },
    {
      name: 'Cash on Delivery',
      description: 'Pay in cash when your order is delivered to your door.',
      type: PaymentMethodType.CASH_ON_DELIVERY,
      instructions: `
        <p>Your order will be delivered and you pay the driver in cash.</p>
        <p><strong>Please have the exact amount ready:</strong> our drivers do not carry change.</p>
        <p>Available for orders up to $500 within our delivery zones.</p>
      `,
      sortOrder: 2,
    },
  ]

  const created = []
  for (const method of methods) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { storeId, name: method.name },
    })

    const record = existing
      ? await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: { isActive: true, description: method.description },
        })
      : await prisma.paymentMethod.create({
          data: {
            storeId,
            name: method.name,
            description: method.description,
            type: method.type,
            instructions: method.instructions,
            isActive: true,
            sortOrder: method.sortOrder,
          },
        })

    created.push(record)
    console.log(`[seed]   Payment method ready: "${record.name}"`)
  }

  return created
}

// ---------------------------------------------------------------------------
// 11. Email Templates
// ---------------------------------------------------------------------------

const ORDER_CONFIRMED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0F172A;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Tech Haven</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;font-weight:700;">Order Confirmed!</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Hi {{customer.firstName}}, thank you for your order. We've received it and will start processing it shortly.
              </p>
              <!-- Order box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Order Number</p>
                    <p style="margin:0;color:#0F172A;font-size:20px;font-weight:700;">#{{order.number}}</p>
                  </td>
                  <td style="padding:20px 24px;text-align:right;">
                    <p style="margin:0 0 4px;color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Order Date</p>
                    <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">{{order.date}}</p>
                  </td>
                </tr>
              </table>
              <!-- Items heading -->
              <h3 style="margin:0 0 16px;color:#0F172A;font-size:16px;font-weight:600;">Items Ordered</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                {{#each order.items}}
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #F1F5F9;">
                    <p style="margin:0;color:#0F172A;font-size:14px;font-weight:600;">{{this.name}}</p>
                    <p style="margin:2px 0 0;color:#94A3B8;font-size:13px;">Qty: {{this.quantity}}</p>
                  </td>
                  <td style="padding:12px 0;border-bottom:1px solid #F1F5F9;text-align:right;">
                    <p style="margin:0;color:#0F172A;font-size:14px;font-weight:600;">{{this.totalPrice}}</p>
                  </td>
                </tr>
                {{/each}}
              </table>
              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:6px 0;color:#475569;font-size:14px;">Subtotal</td>
                  <td style="padding:6px 0;color:#0F172A;font-size:14px;text-align:right;font-weight:600;">{{order.subtotal}}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#475569;font-size:14px;">Shipping</td>
                  <td style="padding:6px 0;color:#0F172A;font-size:14px;text-align:right;font-weight:600;">{{order.shipping}}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#475569;font-size:14px;">Discount</td>
                  <td style="padding:6px 0;color:#DC2626;font-size:14px;text-align:right;font-weight:600;">-{{order.discount}}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;color:#0F172A;font-size:16px;font-weight:700;border-top:2px solid #E2E8F0;">Total</td>
                  <td style="padding:12px 0 0;color:#2563EB;font-size:18px;font-weight:700;text-align:right;border-top:2px solid #E2E8F0;">{{order.total}}</td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{order.trackingUrl}}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">View Your Order</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">Questions? Reply to this email or contact <a href="mailto:support@techhaven.example.com" style="color:#2563EB;text-decoration:none;">support@techhaven.example.com</a></p>
              <p style="margin:0;color:#CBD5E1;font-size:12px;">Tech Haven LLC &bull; 123 Innovation Drive, San Francisco, CA 94105</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

const PAYMENT_RECEIVED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Received</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#059669;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Tech Haven</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#D1FAE5;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:32px;">&#10003;</div>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;font-weight:700;text-align:center;">Payment Received</h2>
              <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.6;text-align:center;">
                Hi {{customer.firstName}}, we've confirmed your payment for order <strong>#{{order.number}}</strong>. Your items are now being prepared for dispatch.
              </p>
              <!-- Payment summary box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#065F46;font-size:14px;padding:4px 0;">Amount Paid</td>
                        <td style="color:#065F46;font-size:16px;font-weight:700;text-align:right;padding:4px 0;">{{order.total}}</td>
                      </tr>
                      <tr>
                        <td style="color:#065F46;font-size:14px;padding:4px 0;">Payment Method</td>
                        <td style="color:#065F46;font-size:14px;font-weight:600;text-align:right;padding:4px 0;">{{order.paymentMethod}}</td>
                      </tr>
                      <tr>
                        <td style="color:#065F46;font-size:14px;padding:4px 0;">Transaction Reference</td>
                        <td style="color:#065F46;font-size:14px;font-weight:600;text-align:right;padding:4px 0;">{{order.transactionId}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 32px;color:#475569;font-size:14px;line-height:1.6;text-align:center;">
                We will send you another email with tracking information once your order has shipped. Estimated delivery: <strong>{{order.estimatedDelivery}}</strong>.
              </p>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{order.trackingUrl}}" style="display:inline-block;background:#059669;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Track Your Order</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">Questions? Reply to this email or contact <a href="mailto:support@techhaven.example.com" style="color:#2563EB;text-decoration:none;">support@techhaven.example.com</a></p>
              <p style="margin:0;color:#CBD5E1;font-size:12px;">Tech Haven LLC &bull; 123 Innovation Drive, San Francisco, CA 94105</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

async function seedEmailTemplates(storeId: string) {
  console.log('[seed] Creating email templates...')

  const templates = [
    {
      type: 'ORDER_CONFIRMED',
      name: 'Order Confirmation',
      subject: 'Your Tech Haven order #{{order.number}} is confirmed!',
      previewText: 'Thanks for your order — here\'s a summary of what you\'ve purchased.',
      htmlContent: ORDER_CONFIRMED_HTML,
      textContent: [
        'ORDER CONFIRMED — Tech Haven',
        '',
        'Hi {{customer.firstName}},',
        '',
        'Thanks for your order! We\'ve received it and will start processing it shortly.',
        '',
        'Order Number: #{{order.number}}',
        'Order Date: {{order.date}}',
        'Total: {{order.total}}',
        '',
        'View your order: {{order.trackingUrl}}',
        '',
        'Questions? Email us at support@techhaven.example.com',
        '',
        '— The Tech Haven Team',
      ].join('\n'),
    },
    {
      type: 'PAYMENT_RECEIVED',
      name: 'Payment Received',
      subject: 'Payment confirmed for your Tech Haven order #{{order.number}}',
      previewText: 'We\'ve received your payment and your order is being prepared.',
      htmlContent: PAYMENT_RECEIVED_HTML,
      textContent: [
        'PAYMENT RECEIVED — Tech Haven',
        '',
        'Hi {{customer.firstName}},',
        '',
        'Great news — we\'ve confirmed your payment for order #{{order.number}}.',
        '',
        'Amount Paid: {{order.total}}',
        'Payment Method: {{order.paymentMethod}}',
        'Transaction Reference: {{order.transactionId}}',
        '',
        'Estimated Delivery: {{order.estimatedDelivery}}',
        '',
        'Track your order: {{order.trackingUrl}}',
        '',
        'Questions? Email us at support@techhaven.example.com',
        '',
        '— The Tech Haven Team',
      ].join('\n'),
    },
  ]

  for (const tmpl of templates) {
    const record = await prisma.emailTemplate.upsert({
      where: { storeId_type: { storeId, type: tmpl.type } },
      update: {
        name: tmpl.name,
        subject: tmpl.subject,
        previewText: tmpl.previewText,
        htmlContent: tmpl.htmlContent,
        textContent: tmpl.textContent,
        isActive: true,
      },
      create: {
        storeId,
        type: tmpl.type,
        name: tmpl.name,
        subject: tmpl.subject,
        previewText: tmpl.previewText,
        htmlContent: tmpl.htmlContent,
        textContent: tmpl.textContent,
        isActive: true,
      },
    })
    console.log(`[seed]   Email template ready: "${record.name}" (${record.type})`)
  }

  console.log('[seed] Email templates done.')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
  console.log('[seed] Starting database seed...')
  console.log(`[seed] Environment: ${process.env.NODE_ENV ?? 'development'}`)
  console.log()

  try {
    // 1. Admin
    await seedAdminUser()
    console.log()

    // 2. Stores
    const { techHaven } = await seedStores()
    console.log()

    // 3–5. Tech Haven store config, theme, cart
    await seedTechHavenConfig(techHaven.id)
    await seedTechHavenTheme(techHaven.id)
    await seedTechHavenCartConfig(techHaven.id)
    console.log()

    // 6. Categories
    const categories = await seedCategories(techHaven.id)
    console.log()

    // 7. Products
    await seedProducts(techHaven.id, categories)
    console.log()

    // 8. Promotion
    const promotion = await seedPromotion(techHaven.id)
    console.log()

    // 9. Coupon
    await seedCoupon(techHaven.id, promotion.id)
    console.log()

    // 10. Payment methods
    await seedPaymentMethods(techHaven.id)
    console.log()

    // 11. Email templates
    await seedEmailTemplates(techHaven.id)
    console.log()

    console.log('[seed] ✓ Database seed completed successfully.')
  } catch (err) {
    console.error('[seed] ERROR: Seed failed.')
    console.error(err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
