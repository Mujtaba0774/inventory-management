export const mockProducts = [
  // 🍫 Chocolates
  {
    id: '1',
    name: 'Cadbury Dairy Milk (38g)',
    category: 'Chocolates',
    sku: 'CDM-001',
    stock: 145,
    minStock: 20,
    price: 180,
    cost: 120,
    description: 'Smooth and creamy milk chocolate bar',
    vendor: 'Cadbury Pakistan',
    dateAdded: '2024-01-15',
    lastUpdated: '2026-04-28'
  },
  {
    id: '2',
    name: 'KitKat (4 Finger)',
    category: 'Chocolates',
    sku: 'KTK-002',
    stock: 67,
    minStock: 15,
    price: 160,
    cost: 110,
    description: 'Crispy wafer fingers covered with milk chocolate',
    vendor: 'Nestlé Pakistan',
    dateAdded: '2024-02-01',
    lastUpdated: '2026-04-27'
  },

  // 🍬 Candies
  {
    id: '3',
    name: 'CandyLand Chillz',
    category: 'Candies',
    sku: 'CLC-003',
    stock: 312,
    minStock: 40,
    price: 5,
    cost: 2,
    description: 'Cool mint-flavored candy',
    vendor: 'Ismail Industries',
    dateAdded: '2024-03-01',
    lastUpdated: '2026-04-29'
  },
  {
    id: '4',
    name: 'ABC Goli Candy',
    category: 'Candies',
    sku: 'ABC-004',
    stock: 425,
    minStock: 50,
    price: 2,
    cost: 1,
    description: 'Classic colorful goli candy',
    vendor: 'Local Distributor',
    dateAdded: '2024-02-10',
    lastUpdated: '2026-04-26'
  },

  // 🍭 Lollipops
  {
    id: '5',
    name: 'Chupa Chups Strawberry',
    category: 'Lollipops',
    sku: 'CC-005',
    stock: 89,
    minStock: 25,
    price: 30,
    cost: 18,
    description: 'Strawberry flavored lollipop',
    vendor: 'Chupa Chups Pakistan',
    dateAdded: '2024-01-25',
    lastUpdated: '2026-04-28'
  },

  // 🐻 Gummies & Jelly
  {
    id: '6',
    name: 'CandyLand Jellies (Fruit Mix)',
    category: 'Gummies & Jelly',
    sku: 'CLJ-006',
    stock: 156,
    minStock: 30,
    price: 50,
    cost: 30,
    description: 'Assorted fruit-flavored jelly candies',
    vendor: 'Ismail Industries',
    dateAdded: '2024-02-18',
    lastUpdated: '2026-04-25'
  },

  // 🍟 Chips
  {
    id: '7',
    name: 'Lays Masala',
    category: 'Chips',
    sku: 'LAYS-007',
    stock: 78,
    minStock: 20,
    price: 50,
    cost: 30,
    description: 'Masala-flavored potato chips',
    vendor: 'PepsiCo Pakistan',
    dateAdded: '2024-03-05',
    lastUpdated: '2026-04-29'
  },

  // 🥨 Crisps (Slanty, Kurleez)
  {
    id: '8',
    name: 'Slanty Cheese Flavor',
    category: 'Crisps (Slanty, Kurleez)',
    sku: 'SLT-008',
    stock: 12,
    minStock: 18,
    price: 40,
    cost: 22,
    description: 'Cheese flavored corn crisps',
    vendor: 'Ismail Industries',
    dateAdded: '2024-02-22',
    lastUpdated: '2026-04-29'
  },

  // 🍪 Biscuits
  {
    id: '9',
    name: 'Peek Freans Sooper (Half Roll)',
    category: 'Biscuits',
    sku: 'PF-009',
    stock: 198,
    minStock: 35,
    price: 120,
    cost: 75,
    description: 'Egg and milk biscuits',
    vendor: 'EBM Pakistan',
    dateAdded: '2024-03-01',
    lastUpdated: '2026-04-27'
  },

  // 🌶️ Nimko
  {
    id: '10',
    name: 'Mix Nimko (200g)',
    category: 'Nimko',
    sku: 'NMK-010',
    stock: 42,
    minStock: 15,
    price: 160,
    cost: 100,
    description: 'Spicy traditional Pakistani nimko mix',
    vendor: 'Local Manufacturer',
    dateAdded: '2024-02-28',
    lastUpdated: '2026-04-28'
  },

  // 🍯 Gajak
  {
    id: '11',
    name: 'Til Gajak (250g)',
    category: 'Gajak',
    sku: 'GJK-011',
    stock: 28,
    minStock: 12,
    price: 220,
    cost: 150,
    description: 'Traditional sesame jaggery sweet',
    vendor: 'Local Sweet Shop',
    dateAdded: '2024-01-20',
    lastUpdated: '2026-04-26'
  },

  // 🍬 Rewari
  {
    id: '12',
    name: 'Til Rewari (250g)',
    category: 'Rewari',
    sku: 'RWR-012',
    stock: 35,
    minStock: 10,
    price: 180,
    cost: 120,
    description: 'Sesame candy made with jaggery',
    vendor: 'Local Sweet Shop',
    dateAdded: '2024-01-22',
    lastUpdated: '2026-04-29'
  }
];

export const mockVendors = [
  {
    id: 'sup-1',
    name: 'Cadbury Pakistan',
    email: 'accounts@cadburypakistan.com',
    phone: '+92 21 111 223 344',
    address: 'F-8 Industrial Area, Karachi',
    created_at: '2024-01-05',
    updated_at: '2026-04-28'
  },
  {
    id: 'sup-2',
    name: 'Nestlé Pakistan',
    email: 'sales@nestlepakistan.com',
    phone: '+92 42 111 777 111',
    address: 'Lahore - Sheikhupura Road, Lahore',
    created_at: '2024-01-12',
    updated_at: '2026-04-27'
  },
  {
    id: 'sup-3',
    name: 'Ismail Industries',
    email: 'trade@ismailindustries.com',
    phone: '+92 21 111 123 456',
    address: 'Korangi Industrial Area, Karachi',
    created_at: '2024-02-01',
    updated_at: '2026-04-29'
  },
  {
    id: 'sup-4',
    name: 'Local Distributor',
    email: 'orders@localdistributor.pk',
    phone: '+92 300 555 7788',
    address: 'Tower Market, Karachi',
    created_at: '2024-02-10',
    updated_at: '2026-04-26'
  },
  {
    id: 'sup-5',
    name: 'Chupa Chups Pakistan',
    email: 'support@chupachupspakistan.com',
    phone: '+92 21 345 678 90',
    address: 'Export Processing Zone, Karachi',
    created_at: '2024-02-15',
    updated_at: '2026-04-28'
  },
  {
    id: 'sup-6',
    name: 'PepsiCo Pakistan',
    email: 'wholesale@pepsicopakistan.com',
    phone: '+92 42 111 555 999',
    address: 'Faisalabad Industrial Estate, Faisalabad',
    created_at: '2024-03-05',
    updated_at: '2026-04-29'
  },
  {
    id: 'sup-7',
    name: 'EBM Pakistan',
    email: 'orders@ebmpk.com',
    phone: '+92 21 111 111 326',
    address: 'Korangi Creek Road, Karachi',
    created_at: '2024-03-12',
    updated_at: '2026-04-27'
  },
  {
    id: 'sup-8',
    name: 'Local Manufacturer',
    email: 'info@localmanufacturer.pk',
    phone: '+92 333 444 5566',
    address: 'M.A. Jinnah Road, Karachi',
    created_at: '2024-03-20',
    updated_at: '2026-04-28'
  },
  {
    id: 'sup-9',
    name: 'Local Sweet Shop',
    email: 'sweetshop@gmail.com',
    phone: '+92 321 900 1122',
    address: 'Anarkali Bazaar, Lahore',
    created_at: '2024-01-20',
    updated_at: '2026-04-26'
  }
];

export const mockVendorTransactions = [
  {
    id: 'STX-001',
    vendor_id: 'sup-1',
    transaction_type: 'IN',
    amount: 48000,
    description: 'January chocolate restock',
    notes: 'Cadbury Dairy Milk stock for three retail branches',
    reference_no: 'INV-CAD-2401',
    transaction_date: '2026-01-02',
    created_at: '2026-01-02',
    updated_at: '2026-01-02'
  },
  {
    id: 'STX-002',
    vendor_id: 'sup-1',
    transaction_type: 'OUT',
    amount: 15000,
    description: 'Partial payment for January invoice',
    notes: 'Transferred from main cash account',
    reference_no: 'PAY-CAD-2401',
    transaction_date: '2026-01-10',
    created_at: '2026-01-10',
    updated_at: '2026-01-10'
  },
  {
    id: 'STX-003',
    vendor_id: 'sup-3',
    transaction_type: 'IN',
    amount: 22000,
    description: 'CandyLand and jelly order',
    notes: 'Stocked after winter sale campaign',
    reference_no: 'INV-ISM-2402',
    transaction_date: '2026-02-01',
    created_at: '2026-02-01',
    updated_at: '2026-02-01'
  },
  {
    id: 'STX-004',
    vendor_id: 'sup-3',
    transaction_type: 'OUT',
    amount: 12000,
    description: 'Vendor payment installment',
    notes: 'Cleared half of February balance',
    reference_no: 'PAY-ISM-2402',
    transaction_date: '2026-02-18',
    created_at: '2026-02-18',
    updated_at: '2026-02-18'
  },
  {
    id: 'STX-005',
    vendor_id: 'sup-6',
    transaction_type: 'IN',
    amount: 36000,
    description: 'March chips restock',
    notes: 'Lays Masala and other snack lines',
    reference_no: 'INV-PEP-2403',
    transaction_date: '2026-03-02',
    created_at: '2026-03-02',
    updated_at: '2026-03-02'
  },
  {
    id: 'STX-006',
    vendor_id: 'sup-6',
    transaction_type: 'OUT',
    amount: 16000,
    description: 'March payment',
    notes: 'Against snack and chips invoice',
    reference_no: 'PAY-PEP-2403',
    transaction_date: '2026-03-15',
    created_at: '2026-03-15',
    updated_at: '2026-03-15'
  },
  {
    id: 'STX-007',
    vendor_id: 'sup-7',
    transaction_type: 'IN',
    amount: 19500,
    description: 'Biscuits shipment',
    notes: 'Peek Freans Sooper stock for April',
    reference_no: 'INV-EBM-2404',
    transaction_date: '2026-03-18',
    created_at: '2026-03-18',
    updated_at: '2026-03-18'
  },
  {
    id: 'STX-008',
    vendor_id: 'sup-7',
    transaction_type: 'OUT',
    amount: 10000,
    description: 'Advance payment',
    notes: 'Paid before new shipment dispatch',
    reference_no: 'PAY-EBM-2404',
    transaction_date: '2026-03-29',
    created_at: '2026-03-29',
    updated_at: '2026-03-29'
  },
  {
    id: 'STX-009',
    vendor_id: 'sup-9',
    transaction_type: 'IN',
    amount: 12400,
    description: 'Gajak and rewari order',
    notes: 'Seasonal purchase for April sweet sales',
    reference_no: 'INV-SWT-2404',
    transaction_date: '2026-04-03',
    created_at: '2026-04-03',
    updated_at: '2026-04-03'
  },
  {
    id: 'STX-010',
    vendor_id: 'sup-9',
    transaction_type: 'OUT',
    amount: 6000,
    description: 'April payment',
    notes: 'Cash payment against sweet shop invoice',
    reference_no: 'PAY-SWT-2404',
    transaction_date: '2026-04-21',
    created_at: '2026-04-21',
    updated_at: '2026-04-21'
  },
  {
    id: 'STX-011',
    vendor_id: 'sup-2',
    transaction_type: 'IN',
    amount: 28500,
    description: 'KitKat restock order',
    notes: 'Placed before month-end promotion',
    reference_no: 'INV-NES-2404',
    transaction_date: '2026-04-06',
    created_at: '2026-04-06',
    updated_at: '2026-04-06'
  },
  {
    id: 'STX-012',
    vendor_id: 'sup-2',
    transaction_type: 'OUT',
    amount: 14000,
    description: 'Payment against April invoice',
    notes: 'Scheduled transfer completed in two installments',
    reference_no: 'PAY-NES-2404',
    transaction_date: '2026-04-24',
    created_at: '2026-04-24',
    updated_at: '2026-04-24'
  },
  {
    id: 'STX-013',
    vendor_id: 'sup-4',
    transaction_type: 'IN',
    amount: 9400,
    description: 'Local candies and display stock',
    notes: 'Small recurring purchase for counter sales',
    reference_no: 'INV-LOC-2404',
    transaction_date: '2026-04-08',
    created_at: '2026-04-08',
    updated_at: '2026-04-08'
  },
  {
    id: 'STX-014',
    vendor_id: 'sup-4',
    transaction_type: 'OUT',
    amount: 4000,
    description: 'Cash settlement',
    notes: 'Paid after weekly sales collection',
    reference_no: 'PAY-LOC-2404',
    transaction_date: '2026-04-19',
    created_at: '2026-04-19',
    updated_at: '2026-04-19'
  },
  {
    id: 'STX-015',
    vendor_id: 'sup-5',
    transaction_type: 'IN',
    amount: 7200,
    description: 'Lollipop restock',
    notes: 'Strawberry flavor shipment for April promotions',
    reference_no: 'INV-CHU-2404',
    transaction_date: '2026-04-09',
    created_at: '2026-04-09',
    updated_at: '2026-04-09'
  },
  {
    id: 'STX-016',
    vendor_id: 'sup-5',
    transaction_type: 'OUT',
    amount: 2500,
    description: 'Partial payment',
    notes: 'Settled before dispatch of next batch',
    reference_no: 'PAY-CHU-2404',
    transaction_date: '2026-04-26',
    created_at: '2026-04-26',
    updated_at: '2026-04-26'
  },
  {
    id: 'STX-017',
    vendor_id: 'sup-8',
    transaction_type: 'IN',
    amount: 16800,
    description: 'Nimko and snack mix order',
    notes: 'Restock for fast-moving local items',
    reference_no: 'INV-LMN-2404',
    transaction_date: '2026-04-12',
    created_at: '2026-04-12',
    updated_at: '2026-04-12'
  },
  {
    id: 'STX-018',
    vendor_id: 'sup-8',
    transaction_type: 'OUT',
    amount: 9000,
    description: 'April vendor payment',
    notes: 'Paid after receiving damaged replacement stock',
    reference_no: 'PAY-LMN-2404',
    transaction_date: '2026-04-27',
    created_at: '2026-04-27',
    updated_at: '2026-04-27'
  }
];

export const mockStockMovements = [
  // ==================== JANUARY 2026 ====================
  // Restocks
  { id: 'PO-JAN-001', productId: '1', type: 'in', quantity: 100, date: '2026-01-02', reason: 'Restock', reference: 'PO-001' },
  { id: 'PO-JAN-002', productId: '3', type: 'in', quantity: 200, date: '2026-01-05', reason: 'Restock', reference: 'PO-002' },
  { id: 'PO-JAN-003', productId: '7', type: 'in', quantity: 150, date: '2026-01-08', reason: 'Restock', reference: 'PO-003' },
  
  // Sales - January
  { id: 'SAL-JAN-001', productId: '1', type: 'out', quantity: 35, date: '2026-01-03', reason: 'Sale', reference: 'ORD-0101' },
  { id: 'SAL-JAN-002', productId: '2', type: 'out', quantity: 28, date: '2026-01-06', reason: 'Sale', reference: 'ORD-0102' },
  { id: 'SAL-JAN-003', productId: '3', type: 'out', quantity: 45, date: '2026-01-07', reason: 'Sale', reference: 'ORD-0103' },
  { id: 'SAL-JAN-004', productId: '4', type: 'out', quantity: 80, date: '2026-01-09', reason: 'Sale', reference: 'ORD-0104' },
  { id: 'SAL-JAN-005', productId: '5', type: 'out', quantity: 22, date: '2026-01-10', reason: 'Sale', reference: 'ORD-0105' },
  { id: 'SAL-JAN-006', productId: '6', type: 'out', quantity: 35, date: '2026-01-12', reason: 'Sale', reference: 'ORD-0106' },
  { id: 'SAL-JAN-007', productId: '7', type: 'out', quantity: 42, date: '2026-01-14', reason: 'Sale', reference: 'ORD-0107' },
  { id: 'SAL-JAN-008', productId: '9', type: 'out', quantity: 55, date: '2026-01-16', reason: 'Sale', reference: 'ORD-0108' },
  { id: 'SAL-JAN-009', productId: '1', type: 'out', quantity: 30, date: '2026-01-18', reason: 'Sale', reference: 'ORD-0109' },
  { id: 'SAL-JAN-010', productId: '10', type: 'out', quantity: 18, date: '2026-01-20', reason: 'Sale', reference: 'ORD-0110' },
  
  // Damage & Loss - January
  { id: 'DMG-JAN-001', productId: '3', type: 'out', quantity: 8, date: '2026-01-08', reason: 'Damage', reference: 'DAMAGE-JAN-001' },
  { id: 'LSS-JAN-001', productId: '5', type: 'out', quantity: 3, date: '2026-01-15', reason: 'Loss', reference: 'LOSS-JAN-001' },

  // ==================== FEBRUARY 2026 ====================
  // Restocks
  { id: 'PO-FEB-001', productId: '1', type: 'in', quantity: 120, date: '2026-02-01', reason: 'Restock', reference: 'PO-004' },
  { id: 'PO-FEB-002', productId: '5', type: 'in', quantity: 180, date: '2026-02-03', reason: 'Restock', reference: 'PO-005' },
  
  // Sales - February (increased trend)
  { id: 'SAL-FEB-001', productId: '1', type: 'out', quantity: 42, date: '2026-02-02', reason: 'Sale', reference: 'ORD-0201' },
  { id: 'SAL-FEB-002', productId: '2', type: 'out', quantity: 38, date: '2026-02-04', reason: 'Sale', reference: 'ORD-0202' },
  { id: 'SAL-FEB-003', productId: '3', type: 'out', quantity: 65, date: '2026-02-05', reason: 'Sale', reference: 'ORD-0203' },
  { id: 'SAL-FEB-004', productId: '4', type: 'out', quantity: 92, date: '2026-02-06', reason: 'Sale', reference: 'ORD-0204' },
  { id: 'SAL-FEB-005', productId: '5', type: 'out', quantity: 35, date: '2026-02-08', reason: 'Sale', reference: 'ORD-0205' },
  { id: 'SAL-FEB-006', productId: '6', type: 'out', quantity: 48, date: '2026-02-09', reason: 'Sale', reference: 'ORD-0206' },
  { id: 'SAL-FEB-007', productId: '7', type: 'out', quantity: 55, date: '2026-02-11', reason: 'Sale', reference: 'ORD-0207' },
  { id: 'SAL-FEB-008', productId: '8', type: 'out', quantity: 28, date: '2026-02-13', reason: 'Sale', reference: 'ORD-0208' },
  { id: 'SAL-FEB-009', productId: '9', type: 'out', quantity: 62, date: '2026-02-15', reason: 'Sale', reference: 'ORD-0209' },
  { id: 'SAL-FEB-010', productId: '10', type: 'out', quantity: 25, date: '2026-02-17', reason: 'Sale', reference: 'ORD-0210' },
  { id: 'SAL-FEB-011', productId: '1', type: 'out', quantity: 38, date: '2026-02-19', reason: 'Sale', reference: 'ORD-0211' },
  { id: 'SAL-FEB-012', productId: '11', type: 'out', quantity: 15, date: '2026-02-21', reason: 'Sale', reference: 'ORD-0212' },
  
  // Damage & Loss - February
  { id: 'DMG-FEB-001', productId: '4', type: 'out', quantity: 12, date: '2026-02-07', reason: 'Damage', reference: 'DAMAGE-FEB-001' },
  { id: 'LSS-FEB-001', productId: '7', type: 'out', quantity: 5, date: '2026-02-12', reason: 'Loss', reference: 'LOSS-FEB-001' },
  { id: 'LSS-FEB-002', productId: '6', type: 'out', quantity: 4, date: '2026-02-18', reason: 'Loss', reference: 'LOSS-FEB-002' },

  // ==================== MARCH 2026 ====================
  // Restocks
  { id: 'PO-MAR-001', productId: '2', type: 'in', quantity: 95, date: '2026-03-02', reason: 'Restock', reference: 'PO-006' },
  { id: 'PO-MAR-002', productId: '9', type: 'in', quantity: 140, date: '2026-03-05', reason: 'Restock', reference: 'PO-007' },
  { id: 'PO-MAR-003', productId: '11', type: 'in', quantity: 60, date: '2026-03-08', reason: 'Restock', reference: 'PO-008' },
  
  // Sales - March (highest sales month)
  { id: 'SAL-MAR-001', productId: '1', type: 'out', quantity: 48, date: '2026-03-01', reason: 'Sale', reference: 'ORD-0301' },
  { id: 'SAL-MAR-002', productId: '2', type: 'out', quantity: 45, date: '2026-03-03', reason: 'Sale', reference: 'ORD-0302' },
  { id: 'SAL-MAR-003', productId: '3', type: 'out', quantity: 78, date: '2026-03-04', reason: 'Sale', reference: 'ORD-0303' },
  { id: 'SAL-MAR-004', productId: '4', type: 'out', quantity: 105, date: '2026-03-06', reason: 'Sale', reference: 'ORD-0304' },
  { id: 'SAL-MAR-005', productId: '5', type: 'out', quantity: 42, date: '2026-03-07', reason: 'Sale', reference: 'ORD-0305' },
  { id: 'SAL-MAR-006', productId: '6', type: 'out', quantity: 55, date: '2026-03-09', reason: 'Sale', reference: 'ORD-0306' },
  { id: 'SAL-MAR-007', productId: '7', type: 'out', quantity: 68, date: '2026-03-11', reason: 'Sale', reference: 'ORD-0307' },
  { id: 'SAL-MAR-008', productId: '8', type: 'out', quantity: 38, date: '2026-03-12', reason: 'Sale', reference: 'ORD-0308' },
  { id: 'SAL-MAR-009', productId: '9', type: 'out', quantity: 75, date: '2026-03-14', reason: 'Sale', reference: 'ORD-0309' },
  { id: 'SAL-MAR-010', productId: '10', type: 'out', quantity: 32, date: '2026-03-16', reason: 'Sale', reference: 'ORD-0310' },
  { id: 'SAL-MAR-011', productId: '1', type: 'out', quantity: 35, date: '2026-03-18', reason: 'Sale', reference: 'ORD-0311' },
  { id: 'SAL-MAR-012', productId: '12', type: 'out', quantity: 18, date: '2026-03-20', reason: 'Sale', reference: 'ORD-0312' },
  { id: 'SAL-MAR-013', productId: '3', type: 'out', quantity: 52, date: '2026-03-22', reason: 'Sale', reference: 'ORD-0313' },
  { id: 'SAL-MAR-014', productId: '11', type: 'out', quantity: 25, date: '2026-03-25', reason: 'Sale', reference: 'ORD-0314' },
  
  // Damage & Loss - March
  { id: 'DMG-MAR-001', productId: '5', type: 'out', quantity: 6, date: '2026-03-10', reason: 'Damage', reference: 'DAMAGE-MAR-001' },
  { id: 'LSS-MAR-001', productId: '2', type: 'out', quantity: 4, date: '2026-03-13', reason: 'Loss', reference: 'LOSS-MAR-001' },
  { id: 'DMG-MAR-002', productId: '9', type: 'out', quantity: 8, date: '2026-03-19', reason: 'Damage', reference: 'DAMAGE-MAR-002' },

  // ==================== APRIL 2026 ====================
  // Restocks
  { id: 'PO-APR-001', productId: '1', type: 'in', quantity: 110, date: '2026-04-01', reason: 'Restock', reference: 'PO-009' },
  { id: 'PO-APR-002', productId: '8', type: 'in', quantity: 120, date: '2026-04-03', reason: 'Restock', reference: 'PO-010' },
  { id: 'PO-APR-003', productId: '10', type: 'in', quantity: 80, date: '2026-04-06', reason: 'Restock', reference: 'PO-011' },
  
  // Sales - April (slight decrease from March)
  { id: 'SAL-APR-001', productId: '1', type: 'out', quantity: 38, date: '2026-04-02', reason: 'Sale', reference: 'ORD-0401' },
  { id: 'SAL-APR-002', productId: '2', type: 'out', quantity: 32, date: '2026-04-04', reason: 'Sale', reference: 'ORD-0402' },
  { id: 'SAL-APR-003', productId: '3', type: 'out', quantity: 55, date: '2026-04-05', reason: 'Sale', reference: 'ORD-0403' },
  { id: 'SAL-APR-004', productId: '4', type: 'out', quantity: 78, date: '2026-04-07', reason: 'Sale', reference: 'ORD-0404' },
  { id: 'SAL-APR-005', productId: '5', type: 'out', quantity: 28, date: '2026-04-08', reason: 'Sale', reference: 'ORD-0405' },
  { id: 'SAL-APR-006', productId: '6', type: 'out', quantity: 42, date: '2026-04-10', reason: 'Sale', reference: 'ORD-0406' },
  { id: 'SAL-APR-007', productId: '7', type: 'out', quantity: 48, date: '2026-04-12', reason: 'Sale', reference: 'ORD-0407' },
  { id: 'SAL-APR-008', productId: '9', type: 'out', quantity: 58, date: '2026-04-14', reason: 'Sale', reference: 'ORD-0408' },
  { id: 'SAL-APR-009', productId: '10', type: 'out', quantity: 22, date: '2026-04-16', reason: 'Sale', reference: 'ORD-0409' },
  { id: 'SAL-APR-010', productId: '11', type: 'out', quantity: 20, date: '2026-04-18', reason: 'Sale', reference: 'ORD-0410' },
  { id: 'SAL-APR-011', productId: '12', type: 'out', quantity: 14, date: '2026-04-20', reason: 'Sale', reference: 'ORD-0411' },
  { id: 'SAL-APR-012', productId: '1', type: 'out', quantity: 25, date: '2026-04-22', reason: 'Sale', reference: 'ORD-0412' },
  { id: 'SAL-APR-013', productId: '3', type: 'out', quantity: 38, date: '2026-04-24', reason: 'Sale', reference: 'ORD-0413' },
  { id: 'SAL-APR-014', productId: '8', type: 'out', quantity: 32, date: '2026-04-26', reason: 'Sale', reference: 'ORD-0414' },
  
  // Damage & Loss - April
  { id: 'DMG-APR-001', productId: '1', type: 'out', quantity: 5, date: '2026-04-11', reason: 'Damage', reference: 'DAMAGE-APR-001' },
  { id: 'LSS-APR-001', productId: '4', type: 'out', quantity: 7, date: '2026-04-15', reason: 'Loss', reference: 'LOSS-APR-001' },
  { id: 'LSS-APR-002', productId: '9', type: 'out', quantity: 3, date: '2026-04-25', reason: 'Loss', reference: 'LOSS-APR-002' }
];
