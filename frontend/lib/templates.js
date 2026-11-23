/**
 * Business Template Engine for Hisaaboo
 * Enables multi-tenant customization for any trade vertical:
 * - Yarn / Suta Trading (সুতা ব্যবসা)
 * - Grocery & Wholesale (মুদি ও খাদ্যপণ্য)
 * - Electronics & Mobile (ইলেকট্রনিক্স ও গ্যাজেট শোরুম)
 * - Pharmacy & Medicine (ফার্মেসি ও ঔষধের দোকান)
 * - Clothing & Garments (পোশাক ও থান কাপড়)
 * - Rod, Cement & Hardware (রড-সিমেন্ট ও হার্ডওয়্যার)
 * - General Trading (সাধারণ ব্যবসা)
 */

export const ALL_MODULES = [
  { id: 'dashboard', name: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' } },
  { id: 'sales', name: { en: 'Sales & Invoices', bn: 'বিক্রয় ও মেমো' } },
  { id: 'challans', name: { en: 'Delivery Challans', bn: 'ডেলিভারি চালান হাব' } },
  { id: 'quotations', name: { en: 'Quotations', bn: 'দরপত্র / কোটেশন' } },
  { id: 'purchases', name: { en: 'Purchases', bn: 'ক্রয় / মিল চালান' } },
  { id: 'returns', name: { en: 'Returns & Damage', bn: 'ফেরত ও ড্যামেজ' } },
  { id: 'products', name: { en: 'Products & Stock', bn: 'পণ্য ও স্টক' } },
  { id: 'parties', name: { en: 'Parties', bn: 'পার্টি / খাতা' } },
  { id: 'payments', name: { en: 'Payments', bn: 'লেনদেন / জমা-খরচ' } },
  { id: 'banking', name: { en: 'Bank Accounts', bn: 'ব্যাংক হিসাব ও চেক' } },
  { id: 'cashbook', name: { en: 'Cash Book / Daybook', bn: 'ক্যাশ বুক / রোজনামচা' } },
  { id: 'expenses', name: { en: 'Expenses', bn: 'অফিস খরচ' } },
  { id: 'payroll', name: { en: 'Payroll & Staff', bn: 'কর্মচারী ও বেতন' } },
  { id: 'reports', name: { en: 'Reports', bn: 'আর্থিক রিপোর্ট' } },
  { id: 'settings', name: { en: 'Settings', bn: 'সেটিংস' } },
];

export const BUSINESS_TEMPLATES = {
  yarn: {
    id: 'yarn',
    name: {
      en: 'Yarn (Suta) Trading',
      bn: 'সুতা ব্যবসা (ইয়ার্ন ট্রেডিং)',
    },
    description: {
      en: 'Specialized for yarn merchants, mill brokers, and textile traders with count, mill/brand, lot, cones, and bag weight tracking.',
      bn: 'কাউন্ট, মিল/ব্র্যান্ড, ধরন (Carded/Combed), লট, বস্তা প্রতি কোণ ও ওজন ট্র্যাকিং সহ সুতা ব্যবসায়ীদের জন্য বিশেষায়িত।',
    },
    units: [
      { key: 'bag', label: { en: 'Bag (বস্তা)', bn: 'বস্তা' } },
      { key: 'lb', label: { en: 'Pound (Lb)', bn: 'পাউন্ড' } },
      { key: 'kg', label: { en: 'Kg', bn: 'কেজি' } },
      { key: 'cone', label: { en: 'Cone', bn: 'কোন' } },
    ],
    extraProductFields: [
      {
        key: 'count',
        type: 'select-or-text',
        label: { en: 'Yarn Count', bn: 'কাউন্ট' },
        placeholder: { en: 'e.g. 20/1, 30/1, 40/1', bn: 'যেমন: ২০/১, ৩০/১, ৪০/১' },
        options: ['10/1', '16/1', '20/1', '24/1', '26/1', '30/1', '34/1', '40/1', '50/1', '60/1', '80/1'],
        required: false,
      },
      {
        key: 'yarnType',
        type: 'select-or-text',
        label: { en: 'Yarn Type', bn: 'সুতার ধরন / টাইপ' },
        placeholder: { en: 'e.g. Carded, Combed, Slub', bn: 'যেমন: কার্ডেড, কম্বড, স্লাব' },
        options: ['Carded', 'Combed', 'Slub', 'Melange', 'Lycra / Spandex', 'CVC', 'PC', 'Polyester', 'Rotor'],
        required: false,
      },
      {
        key: 'brand',
        type: 'select-or-text',
        label: { en: 'Spinning Mill / Brand', bn: 'স্পিনিং মিল / ব্র্যান্ড' },
        placeholder: { en: 'e.g. Square, Badsha, Noman', bn: 'যেমন: স্কয়ার, বাদশা, নোমান' },
        options: ['Square Textiles', 'Noman Group', 'Envoy Textiles', 'Badsha Textiles', 'Beximco', 'Pahartali', 'Maksons', 'Akij Textiles'],
        required: false,
      },
      {
        key: 'lot',
        type: 'text',
        label: { en: 'Lot No', bn: 'লট নম্বর' },
        placeholder: { en: 'e.g. L-502, Batch-04', bn: 'যেমন: এল-৫০২, ব্যাচ-০৪' },
        required: false,
      },
      {
        key: 'conesPerBag',
        type: 'number',
        label: { en: 'Cones / Bag', bn: 'কোণ প্রতি বস্তা' },
        placeholder: { en: 'e.g. 24, 30, 32', bn: 'যেমন: ২৪, ৩০, ৩২' },
        required: false,
      },
      {
        key: 'lbsPerBag',
        type: 'number',
        label: { en: 'Bag Weight (Lbs / Kg)', bn: 'ব্যাগের ওজন (Lbs/Kg)' },
        placeholder: { en: 'e.g. 100, 45.36', bn: 'যেমন: ১০০ পাউন্ড' },
        required: false,
      },
      {
        key: 'color',
        type: 'text',
        label: { en: 'Color / Shade', bn: 'রং / শেড' },
        placeholder: { en: 'e.g. Raw White, Bleached', bn: 'যেমন: র হোয়াইট, ব্লিচড' },
        required: false,
      },
    ],
    expenseCategories: [
      { key: 'labour', label: { en: 'Labour / Loading', bn: 'লেবার / কুলি ও লোডিং খরচ' } },
      { key: 'transport', label: { en: 'Transport / Carriage', bn: 'গাড়ি ভাড়া / পরিবহন' } },
      { key: 'rent', label: { en: 'Gudam / Shop Rent', bn: 'গোডাউন / দোকান ভাড়া' } },
      { key: 'commission', label: { en: 'Broker / Commission', bn: 'দালালি / ব্রোকার কমিশন' } },
      { key: 'electricity', label: { en: 'Electricity / Utility', bn: 'বিদ্যুৎ ও পানি বিল' } },
      { key: 'other', label: { en: 'Other Expense', bn: 'অন্যান্য খরচ' } },
    ],
    enabledModules: [
      'dashboard', 'sales', 'challans', 'quotations', 'purchases', 'returns',
      'products', 'parties', 'payments', 'banking', 'cashbook', 'expenses',
      'payroll', 'reports', 'settings'
    ],
    labels: {
      party: { en: 'Party / Mahajan', bn: 'পার্টি / মহাজন' },
      customer: { en: 'Customer / Buyer', bn: 'খরিদ্দার / ক্রেতা' },
      supplier: { en: 'Mill / Supplier / Mahajan', bn: 'মিল / সাপ্লায়ার / মহাজন' },
      sale: { en: 'Challan / Memo', bn: 'চালান / মেমো' },
      purchase: { en: 'Purchase / Mill Inward', bn: 'ক্রয় / মিল চালান' },
      product: { en: 'Yarn Item', bn: 'সুতার বিবরণ' },
      stock: { en: 'Current Stock', bn: 'মজুদ সুতা' },
      lot: { en: 'Lot No', bn: 'লট নং' },
      deliveryChallan: { en: 'Delivery Challan & Gate Pass', bn: 'ডেলিভারি চালান ও গেট পাস' },
    },
  },

  grocery: {
    id: 'grocery',
    name: {
      en: 'Grocery & Wholesale Food (মুদি ও খাদ্যপণ্য)',
      bn: 'মুদি, ডিপার্টমেন্টাল ও পাইকারি খাদ্যপণ্য',
    },
    description: {
      en: 'Tailored for grocery stores, super shops, and food wholesalers with brand, pack weight, and carton/sack tracking.',
      bn: 'চাল, ডাল, তেল, চিনি, মসলা ও প্যাকেটজাত পণ্যের পাইকারি ও খুচরা হিসাবের জন্য বিশেষায়িত।',
    },
    units: [
      { key: 'kg', label: { en: 'Kg (কেজি)', bn: 'কেজি' } },
      { key: 'gram', label: { en: 'Gram (গ্রাম)', bn: 'গ্রাম' } },
      { key: 'liter', label: { en: 'Liter (লিটার)', bn: 'লিটার' } },
      { key: 'sack', label: { en: 'Sack (বস্তা)', bn: 'বস্তা' } },
      { key: 'carton', label: { en: 'Carton (কার্টুন)', bn: 'কার্টুন' } },
      { key: 'pack', label: { en: 'Pack (প্যাকেট)', bn: 'প্যাকেট' } },
      { key: 'pcs', label: { en: 'Pcs (পিস)', bn: 'পিস' } },
      { key: 'dozen', label: { en: 'Dozen (ডজন)', bn: 'ডজন' } },
    ],
    extraProductFields: [
      {
        key: 'brand',
        type: 'select-or-text',
        label: { en: 'Brand / Company', bn: 'ব্র্যান্ড / কোম্পানি' },
        placeholder: { en: 'e.g. Teer, Rupchanda, Bashundhara, Pran', bn: 'যেমন: তীর, রূপচাঁদা, বসুন্ধরা, প্রাণ' },
        options: ['তীর (Teer)', 'রূপচাঁদা (Rupchanda)', 'বসুন্ধরা (Bashundhara)', 'প্রাণ (Pran)', 'আকিজ (Akij)', 'ফ্রেশ (Fresh)', 'একমি (Acme)', 'মেঘনা (Meghna)'],
        required: false,
      },
      {
        key: 'packSize',
        type: 'text',
        label: { en: 'Pack Size / Weight', bn: 'প্যাকের সাইজ / ওজন' },
        placeholder: { en: 'e.g. 1 Kg, 5 Liter, 25 Kg Sack, 500gm', bn: 'যেমন: ১ কেজি, ৫ লিটার, ২৫ কেজি বস্তা' },
        required: false,
      },
      {
        key: 'category',
        type: 'select-or-text',
        label: { en: 'Food Category', bn: 'পণ্যের ক্যাটাগরি' },
        placeholder: { en: 'e.g. চাল, তেল, ডাল, মসলা', bn: 'যেমন: চাল, তেল, ডাল, মসলা' },
        options: ['চাল (Rice)', 'ভোজ্যতেল (Edible Oil)', 'ডাল ও শস্য (Pulses)', 'চিনি ও লবণ (Sugar & Salt)', 'মসলা (Spices)', 'চা ও পানীয় (Beverages)', 'বিস্কুট ও স্ন্যাকস (Snacks)', 'টয়লেট্রিজ (Toiletries)'],
        required: false,
      },
    ],
    expenseCategories: [
      { key: 'rent', label: { en: 'Shop / Godown Rent', bn: 'দোকান ও গোডাউন ভাড়া' } },
      { key: 'transport', label: { en: 'Carriage / Van Rent', bn: 'পরিবহন ও ভ্যান ভাড়া' } },
      { key: 'labour', label: { en: 'Labour / Loading', bn: 'কুলি ও লোড-আনলোড খরচ' } },
      { key: 'electricity', label: { en: 'Electricity & Deep Fridge', bn: 'বিদ্যুৎ ও ডিপ ফ্রিজ বিল' } },
      { key: 'salary', label: { en: 'Staff Salary', bn: 'কর্মচারীর বেতন' } },
      { key: 'other', label: { en: 'Other Expense', bn: 'অন্যান্য খরচ' } },
    ],
    enabledModules: [
      'dashboard', 'sales', 'challans', 'quotations', 'purchases', 'returns',
      'products', 'parties', 'payments', 'banking', 'cashbook', 'expenses',
      'payroll', 'reports', 'settings'
    ],
    labels: {
      party: { en: 'Party / Customer & Supplier', bn: 'গ্রাহক ও মহাজন খাতা' },
      customer: { en: 'Customer / Buyer', bn: 'খরিদ্দার / ক্রেতা' },
      supplier: { en: 'Company / Distributor', bn: 'কোম্পানি / পরিবেশক / মহাজন' },
      sale: { en: 'Sales Memo / Cash Memo', bn: 'ক্যাশ মেমো / বিক্রয় রসিদ' },
      purchase: { en: 'Purchase Inward', bn: 'পাইকারি ক্রয় চালান' },
      product: { en: 'Grocery Item', bn: 'মুদি পণ্য' },
      stock: { en: 'Available Stock', bn: 'বর্তমান মজুদ' },
      lot: { en: 'Lot / Batch', bn: 'লট / ব্যাচ' },
      deliveryChallan: { en: 'Delivery Challan', bn: 'ডেলিভারি চালান' },
    },
  },

  electronics: {
    id: 'electronics',
    name: {
      en: 'Electronics & Mobile Gadgets (ইলেকট্রনিক্স ও গ্যাজেট)',
      bn: 'ইলেকট্রনিক্স, মোবাইল ও গ্যাজেট শোরুম',
    },
    description: {
      en: 'Built for mobile phone shops, TV/Fridge showrooms, and computer stores with IMEI, Serial number, Model, and Warranty tracking.',
      bn: 'মোবাইল, টিভি, ফ্রিজ ও কম্পিউটারের জন্য IMEI, সিরিয়াল নম্বর, মডেল ও ওয়ারেন্টি ট্র্যাকিং।',
    },
    units: [
      { key: 'pcs', label: { en: 'Pcs (পিস)', bn: 'পিস' } },
      { key: 'set', label: { en: 'Set (সেট)', bn: 'সেট' } },
      { key: 'box', label: { en: 'Box (বক্স)', bn: 'বক্স' } },
      { key: 'unit', label: { en: 'Unit', bn: 'ইউনিট' } },
    ],
    extraProductFields: [
      {
        key: 'brand',
        type: 'select-or-text',
        label: { en: 'Brand / Make', bn: 'ব্র্যান্ড' },
        placeholder: { en: 'e.g. Samsung, Xiaomi, Apple, Walton', bn: 'যেমন: স্যামসাং, শাওমি, অ্যাপল, ওয়ালটন' },
        options: ['Samsung', 'Xiaomi / Redmi', 'Apple', 'Walton', 'Singer', 'Vision', 'Realme', 'Vivo', 'Oppo', 'Sony', 'LG'],
        required: false,
      },
      {
        key: 'model',
        type: 'text',
        label: { en: 'Model / Variant', bn: 'মডেল / ভ্যারিয়েন্ট' },
        placeholder: { en: 'e.g. Galaxy A55 5G, Redmi Note 13 Pro', bn: 'যেমন: Galaxy A55, Redmi Note 13' },
        required: false,
      },
      {
        key: 'serialOrImei',
        type: 'text',
        label: { en: 'IMEI / Serial Number', bn: 'IMEI / সিরিয়াল নম্বর' },
        placeholder: { en: 'e.g. 861234567890123 / SN-4029', bn: 'যেমন: ৮৬১২৩৪৫৬৭৮৯০১২৩' },
        required: false,
      },
      {
        key: 'warranty',
        type: 'select-or-text',
        label: { en: 'Warranty Coverage', bn: 'ওয়ারেন্টি / গ্যারান্টি' },
        placeholder: { en: 'e.g. 1 Year Official, 2 Years Panel', bn: 'যেমন: ১ বছর অফিসিয়াল, ২ বছর প্যানেল' },
        options: ['১ বছর অফিসিয়াল ওয়্যারেন্টি', '২ বছর প্যানেল ওয়্যারেন্টি', '৬ মাস পার্টস ওয়্যারেন্টি', '১০ বছর কম্প্রেসর ওয়্যারেন্টি', 'ওয়ারেন্টি প্রযোজ্য নয়'],
        required: false,
      },
      {
        key: 'color',
        type: 'text',
        label: { en: 'Color / RAM-ROM', bn: 'রং ও স্পেক্স' },
        placeholder: { en: 'e.g. Phantom Black, 8/128 GB', bn: 'যেমন: Black, 8GB/256GB' },
        required: false,
      },
    ],
    expenseCategories: [
      { key: 'rent', label: { en: 'Showroom Rent', bn: 'শোরুম ভাড়া' } },
      { key: 'electricity', label: { en: 'AC & Electricity Bill', bn: 'এসি ও বিদ্যুৎ বিল' } },
      { key: 'commission', label: { en: 'Sales Incentive / Commission', bn: 'সেলসম্যান কমিশন' } },
      { key: 'service', label: { en: 'Service & Repair Parts', bn: 'সার্ভিসিং ও পার্টস খরচ' } },
      { key: 'transport', label: { en: 'Courier & Transport', bn: 'কুরিয়ার ও পরিবহন' } },
      { key: 'other', label: { en: 'Other Expense', bn: 'অন্যান্য খরচ' } },
    ],
    enabledModules: [
      'dashboard', 'sales', 'challans', 'quotations', 'purchases', 'returns',
      'products', 'parties', 'payments', 'banking', 'cashbook', 'expenses',
      'payroll', 'reports', 'settings'
    ],
    labels: {
      party: { en: 'Customer & Dealer Ledger', bn: 'গ্রাহক ও ডিলার খাতা' },
      customer: { en: 'Buyer / Client', bn: 'ক্রেতা / গ্রাহক' },
      supplier: { en: 'Dealer / Official Importer', bn: 'ডিলার / কোম্পানি' },
      sale: { en: 'Sales & Warranty Memo', bn: 'বিক্রয় ও ওয়ারেন্টি মেমো' },
      purchase: { en: 'Dealer Inward Bill', bn: 'ডিলার চালান' },
      product: { en: 'Gadget / Item', bn: 'ডিভাইস / গ্যাজেট' },
      stock: { en: 'Showroom Stock', bn: 'শোরুম ও গোডাউন স্টক' },
      lot: { en: 'Serial / Batch', bn: 'সিরিয়াল / ব্যাচ' },
      deliveryChallan: { en: 'Delivery Gate Pass', bn: 'ডেলিভারি গেট পাস' },
    },
  },

  pharmacy: {
    id: 'pharmacy',
    name: {
      en: 'Pharmacy & Drug Store (ফার্মেসি ও ঔষধের দোকান)',
      bn: 'ফার্মেসি ও ঔষধের দোকান',
    },
    description: {
      en: 'Dedicated to pharmacies and drug distributors with Generic name, Pharma company, Batch number, and Expiry date tracking.',
      bn: 'ওষুধের জেনেরিক নাম, প্রস্তুতকারক কোম্পানি, ব্যাচ নম্বর ও মেয়াদোত্তীর্ণ তারিখ (Expiry Date) ট্র্যাকিং।',
    },
    units: [
      { key: 'strip', label: { en: 'Strip / Pata (পাতা)', bn: 'পাতা / স্ট্রিপ' } },
      { key: 'box', label: { en: 'Box (বক্স)', bn: 'বক্স' } },
      { key: 'bottle', label: { en: 'Bottle (বোতল)', bn: 'বোতল' } },
      { key: 'pcs', label: { en: 'Pcs / Tablet (ট্যাবলেট/পিস)', bn: 'পিস' } },
      { key: 'ampoule', label: { en: 'Ampoule / Vial (অ্যাম্পুল)', bn: 'অ্যাম্পুল' } },
      { key: 'tube', label: { en: 'Tube (টিউব/মলম)', bn: 'টিউব' } },
    ],
    extraProductFields: [
      {
        key: 'genericName',
        type: 'select-or-text',
        label: { en: 'Generic Name', bn: 'জেনেরিক নাম' },
        placeholder: { en: 'e.g. Paracetamol, Esomeprazole, Cefixime', bn: 'যেমন: Paracetamol, Esomeprazole' },
        options: ['Paracetamol', 'Esomeprazole', 'Omeprazole', 'Cefixime', 'Montelukast', 'Azithromycin', 'Pantoprazole', 'Amoxicillin', 'Metformin'],
        required: false,
      },
      {
        key: 'company',
        type: 'select-or-text',
        label: { en: 'Pharma Company', bn: 'ওষুধ কোম্পানি' },
        placeholder: { en: 'e.g. Square, Beximco, Incepta', bn: 'যেমন: স্কয়ার, বেক্সিমকো, ইনসেপ্টা' },
        options: ['Square Pharmaceuticals', 'Beximco Pharma', 'Incepta', 'Renata', 'Opsonin Pharma', 'Aristopharma', 'Acme Laboratories', 'Radiant', 'Eskayef (SK+F)'],
        required: false,
      },
      {
        key: 'strength',
        type: 'text',
        label: { en: 'Strength / Dosage', bn: 'ডোজ / পাওয়ার' },
        placeholder: { en: 'e.g. 500 mg, 20 mg, 10 mg, 1 gm', bn: 'যেমন: ৫০০ মি.গ্রা., ২০ মি.গ্রা., ১০ মি.গ্রা.' },
        required: false,
      },
      {
        key: 'batchNo',
        type: 'text',
        label: { en: 'Batch No', bn: 'ব্যাচ নম্বর' },
        placeholder: { en: 'e.g. B-9021, D-440', bn: 'যেমন: B-9021, D-440' },
        required: false,
      },
      {
        key: 'expiryDate',
        type: 'text',
        label: { en: 'Expiry Date (MM/YY)', bn: 'মেয়াদোত্তীর্ণ তারিখ (মাস/বছর)' },
        placeholder: { en: 'e.g. 12/2027', bn: 'যেমন: ১২/২০২৭' },
        required: false,
      },
    ],
    expenseCategories: [
      { key: 'rent', label: { en: 'Shop Rent', bn: 'দোকান ভাড়া' } },
      { key: 'electricity', label: { en: 'Medicine Fridge & Electricity', bn: 'ফ্রিজ ও বিদ্যুৎ বিল' } },
      { key: 'salary', label: { en: 'Pharmacist Salary', bn: 'ফার্মাসিস্ট বেতন' } },
      { key: 'license', label: { en: 'Drug License & Renewal', bn: 'ড্রাগ লাইসেন্স নবায়ন' } },
      { key: 'other', label: { en: 'Other Expense', bn: 'অন্যান্য খরচ' } },
    ],
    enabledModules: [
      'dashboard', 'sales', 'challans', 'quotations', 'purchases', 'returns',
      'products', 'parties', 'payments', 'banking', 'cashbook', 'expenses',
      'payroll', 'reports', 'settings'
    ],
    labels: {
      party: { en: 'Patient & Depot Accounts', bn: 'কাস্টমার ও ডিপো খাতা' },
      customer: { en: 'Patient / Customer', bn: 'রোগী / ক্রেতা' },
      supplier: { en: 'Pharma Depot / Company', bn: 'ফার্মা কোম্পানি / ডিপো' },
      sale: { en: 'Prescription Memo', bn: 'প্রেসক্রিপশন মেমো / রসিদ' },
      purchase: { en: 'Drug Purchase Invoice', bn: 'ডিপো চালান' },
      product: { en: 'Medicine / Drug', bn: 'ওষুধের নাম' },
      stock: { en: 'Shelf Stock', bn: 'সেলফ ও ড্রয়ার মজুদ' },
      lot: { en: 'Batch No', bn: 'ব্যাচ নং' },
      deliveryChallan: { en: 'Delivery Challan', bn: 'ডেলিভারি চালান' },
    },
  },

  clothing: {
    id: 'clothing',
    name: {
      en: 'Garments, Fabrics & Fashion (পোশাক ও থান কাপড়)',
      bn: 'পোশাক, থান কাপড় ও ফ্যাশন হাউস',
    },
    description: {
      en: 'Designed for boutique shops, garment wholesalers, and fabric/than traders with Size, Fabric type, Color, and Goj/Meter units.',
      bn: 'থান কাপড়, তৈরি পোশাক, শাড়ি ও থ্রি-পিসের জন্য সাইজ, কালার, ফেব্রিক ও গজ/মিটার ট্র্যাকিং।',
    },
    units: [
      { key: 'pcs', label: { en: 'Pcs (পিস)', bn: 'পিস' } },
      { key: 'goj', label: { en: 'Goj (গজ)', bn: 'গজ' } },
      { key: 'meter', label: { en: 'Meter (মিটার)', bn: 'মিটার' } },
      { key: 'than', label: { en: 'Than (থান)', bn: 'থান' } },
      { key: 'set', label: { en: 'Set (সেট)', bn: 'সেট' } },
      { key: 'dozen', label: { en: 'Dozen (ডজন)', bn: 'ডজন' } },
    ],
    extraProductFields: [
      {
        key: 'size',
        type: 'select-or-text',
        label: { en: 'Size', bn: 'সাইজ' },
        placeholder: { en: 'e.g. S, M, L, XL, XXL, 32, 34', bn: 'যেমন: M, L, XL, ৩২, ৩৪, ফ্রি সাইজ' },
        options: ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', 'Free Size (ফ্রি সাইজ)'],
        required: false,
      },
      {
        key: 'fabricType',
        type: 'select-or-text',
        label: { en: 'Fabric Type', bn: 'কাপড়ের ধরন' },
        placeholder: { en: 'e.g. Cotton, Linen, Georgette, Silk', bn: 'যেমন: কটন / সুতি, লিলেন, জর্জেট, সিল্ক' },
        options: ['কটন (Cotton)', 'লিলেন (Linen)', 'জর্জেট (Georgette)', 'ডেনিম (Denim)', 'সিল্ক (Silk)', 'শিফন (Chiffon)', 'কাতান (Katan)'],
        required: false,
      },
      {
        key: 'color',
        type: 'text',
        label: { en: 'Color / Print', bn: 'রং / প্রিন্ট' },
        placeholder: { en: 'e.g. Navy Blue, Black, Floral', bn: 'যেমন: নেভি ব্লু, ব্ল্যাক, ফ্লোরাল প্রিন্ট' },
        required: false,
      },
      {
        key: 'brand',
        type: 'text',
        label: { en: 'Brand / Factory', bn: 'ব্র্যান্ড / কারখানা' },
        placeholder: { en: 'e.g. Aarong, Local Weave, Boutique', bn: 'যেমন: দেশি তাঁত, আড়ং, বুটিক' },
        required: false,
      },
    ],
    expenseCategories: [
      { key: 'rent', label: { en: 'Showroom / Boutique Rent', bn: 'শোরুম ও দোকান ভাড়া' } },
      { key: 'transport', label: { en: 'Parcel & Transport', bn: 'পার্সেল ও পরিবহন' } },
      { key: 'iron_poly', label: { en: 'Iron & Poly Packaging', bn: 'আয়রন ও প্যাকিং খরচ' } },
      { key: 'tailoring', label: { en: 'Tailoring & Stitching', bn: 'দর্জি ও কারিগর মজুরি' } },
      { key: 'salary', label: { en: 'Staff Salary', bn: 'কর্মচারীর বেতন' } },
      { key: 'other', label: { en: 'Other Expense', bn: 'অন্যান্য খরচ' } },
    ],
    enabledModules: [
      'dashboard', 'sales', 'challans', 'quotations', 'purchases', 'returns',
      'products', 'parties', 'payments', 'banking', 'cashbook', 'expenses',
      'payroll', 'reports', 'settings'
    ],
    labels: {
      party: { en: 'Buyer & Weaver Ledger', bn: 'পাইকার ও খুচরা খাতা' },
      customer: { en: 'Customer / Retail Buyer', bn: 'খরিদ্দার / ক্রেতা' },
      supplier: { en: 'Factory / Weaver / Mahajan', bn: 'কারখানা / তাঁতি / মহাজন' },
      sale: { en: 'Sales Memo', bn: 'বিক্রয় মেমো' },
      purchase: { en: 'Fabric Purchase Inward', bn: 'কাপড় ক্রয় চালান' },
      product: { en: 'Garment / Fabric Item', bn: 'পোশাক ও কাপড়' },
      stock: { en: 'Available Stock', bn: 'বর্তমান মজুদ' },
      lot: { en: 'Design / Lot', bn: 'ডিজাইন / লট' },
      deliveryChallan: { en: 'Delivery Challan', bn: 'ডেলিভারি চালান' },
    },
  },

  hardware: {
    id: 'hardware',
    name: {
      en: 'Rod, Cement, Hardware & Sanitary (রড, সিমেন্ট ও হার্ডওয়্যার)',
      bn: 'রড, সিমেন্ট, হার্ডওয়্যার ও নির্মাণ সামগ্রী',
    },
    description: {
      en: 'Specially engineered for rod/cement merchants, sanitary shops, and building contractors with Ton, Bag, CFT, and Grade/Size tracking.',
      bn: 'রড, সিমেন্ট, টিন, বালু ও স্যানিটারি সামগ্রীর টন, ব্যাগ, সাইজ ও গ্রেড ট্র্যাকিং।',
    },
    units: [
      { key: 'ton', label: { en: 'Ton (টন)', bn: 'টন' } },
      { key: 'bag', label: { en: 'Bag - 50 Kg (ব্যাগ)', bn: 'ব্যাগ' } },
      { key: 'cft', label: { en: 'CFT (সিএফটি)', bn: 'সিএফটি' } },
      { key: 'kg', label: { en: 'Kg (কেজি)', bn: 'কেজি' } },
      { key: 'pcs', label: { en: 'Pcs (পিস)', bn: 'পিস' } },
      { key: 'feet', label: { en: 'Feet (ফুট)', bn: 'ফুট' } },
    ],
    extraProductFields: [
      {
        key: 'brand',
        type: 'select-or-text',
        label: { en: 'Mill / Brand', bn: 'মিল / ব্র্যান্ড' },
        placeholder: { en: 'e.g. BSRM, AKS, Shah Cement, Bashundhara', bn: 'যেমন: BSRM, AKS, শাহ সিমেন্ট, বসুন্ধরা' },
        options: ['BSRM Steels', 'AKS (Abul Khair)', 'KSRM', 'GPH Ispat', 'Shah Cement', 'Bashundhara Cement', 'Seven Rings Cement', 'Premier Cement', 'Holcim'],
        required: false,
      },
      {
        key: 'gradeOrSize',
        type: 'select-or-text',
        label: { en: 'Size / Grade', bn: 'সাইজ / গ্রেড' },
        placeholder: { en: 'e.g. 8mm, 10mm, 12mm, 16mm, 500W, OPC, PCC', bn: 'যেমন: ১০ মি.মি., ১২ মি.মি., ১৬ মি.মি., OPC, PCC' },
        options: ['8 mm (500W)', '10 mm (500W)', '12 mm (500W)', '16 mm (500W)', '20 mm (500W)', 'OPC Cement', 'PCC Cement', 'Standard'],
        required: false,
      },
      {
        key: 'category',
        type: 'select-or-text',
        label: { en: 'Category', bn: 'ক্যাটাগরি' },
        placeholder: { en: 'e.g. রড, সিমেন্ট, টিন, স্যানিটারি', bn: 'যেমন: রড, সিমেন্ট, টিন, স্যানিটারি' },
        options: ['এমএস রড (MS Rod)', 'সিমেন্ট (Cement)', 'ঢেউটিন (CI Sheet)', 'স্যানিটারি ও পাইপ (Sanitary & PVC)', 'কালার ও পেইন্ট (Paints)', 'হার্ডওয়্যার ফিটিংস (Fittings)'],
        required: false,
      },
    ],
    expenseCategories: [
      { key: 'labour', label: { en: 'Labour / Loading & Unloading', bn: 'কুলি ও লোড-আনলোড' } },
      { key: 'transport', label: { en: 'Truck / Trawler Carriage', bn: 'ট্রাক ও ট্রলার ভাড়া' } },
      { key: 'rent', label: { en: 'Yard & Gudam Rent', bn: 'ইয়ার্ড ও গোডাউন ভাড়া' } },
      { key: 'salary', label: { en: 'Staff Salary', bn: 'কর্মচারীর বেতন' } },
      { key: 'other', label: { en: 'Other Expense', bn: 'অন্যান্য খরচ' } },
    ],
    enabledModules: [
      'dashboard', 'sales', 'challans', 'quotations', 'purchases', 'returns',
      'products', 'parties', 'payments', 'banking', 'cashbook', 'expenses',
      'payroll', 'reports', 'settings'
    ],
    labels: {
      party: { en: 'Contractor & Mill Ledger', bn: 'কন্টাক্টর ও মিল খাতা' },
      customer: { en: 'Client / Contractor', bn: 'ক্রেতা / ঠিকাদার' },
      supplier: { en: 'Steel Mill / Cement Company', bn: 'স্টিল মিল / সিমেন্ট কোম্পানি' },
      sale: { en: 'Challan & Bill', bn: 'ডেলিভারি চালান ও বিল' },
      purchase: { en: 'Mill Purchase Inward', bn: 'মিল ক্রয় চালান' },
      product: { en: 'Building Material', bn: 'নির্মাণ সামগ্রী' },
      stock: { en: 'Yard Stock', bn: 'ইয়ার্ড ও গোডাউন মজুদ' },
      lot: { en: 'Heat / Batch No', bn: 'হিট / ব্যাচ নং' },
      deliveryChallan: { en: 'Truck Challan & Gate Pass', bn: 'ট্রাক চালান ও গেট পাস' },
    },
  },

  general: {
    id: 'general',
    name: {
      en: 'General Trading / Wholesale / Retail',
      bn: 'সাধারণ ব্যবসা / পাইকারি ও খুচরা',
    },
    description: {
      en: 'Standard versatile accounting and stock inventory for any general trading, retail or wholesale business.',
      bn: 'যেকোনো সাধারণ পাইকারি ও খুচরা ব্যবসার জন্য স্ট্যান্ডার্ড হিসাব ও ইনভেন্টরি।',
    },
    units: [
      { key: 'pcs', label: { en: 'Pcs (পিস)', bn: 'পিস' } },
      { key: 'kg', label: { en: 'Kg (কেজি)', bn: 'কেজি' } },
      { key: 'dozen', label: { en: 'Dozen (ডজন)', bn: 'ডজন' } },
      { key: 'box', label: { en: 'Box / Carton (বক্স)', bn: 'বক্স' } },
      { key: 'packet', label: { en: 'Packet (প্যাকেট)', bn: 'প্যাকেট' } },
    ],
    extraProductFields: [],
    expenseCategories: [
      { key: 'rent', label: { en: 'Shop Rent', bn: 'দোকান ভাড়া' } },
      { key: 'utility', label: { en: 'Utility / Electricity', bn: 'ইউটিলিটি ও বিদ্যুৎ বিল' } },
      { key: 'salary', label: { en: 'Staff Salary', bn: 'কর্মচারীর বেতন' } },
      { key: 'transport', label: { en: 'Transport / Delivery', bn: 'পরিবহন / যাতায়াত' } },
      { key: 'other', label: { en: 'Other Expense', bn: 'অন্যান্য খরচ' } },
    ],
    enabledModules: [
      'dashboard', 'sales', 'challans', 'quotations', 'purchases', 'returns',
      'products', 'parties', 'payments', 'banking', 'cashbook', 'expenses',
      'payroll', 'reports', 'settings'
    ],
    labels: {
      party: { en: 'Party', bn: 'পার্টি' },
      customer: { en: 'Customer', bn: 'গ্রাহক / কাস্টমার' },
      supplier: { en: 'Supplier', bn: 'সরবরাহকারী / সাপ্লায়ার' },
      sale: { en: 'Sale / Invoice', bn: 'বিক্রয় / ইনভয়েস' },
      purchase: { en: 'Purchase Bill', bn: 'ক্রয় রশিদ' },
      product: { en: 'Product', bn: 'পণ্য' },
      stock: { en: 'Stock', bn: 'মজুদ' },
      lot: { en: 'Batch / Lot', bn: 'ব্যাচ / লট' },
      deliveryChallan: { en: 'Delivery Challan', bn: 'ডেলিভারি চালান' },
    },
  },
};

/**
 * Get template definition by businessType. Defaults to 'general' if not found.
 */
export function getTemplate(businessType = 'general') {
  return BUSINESS_TEMPLATES[businessType] || BUSINESS_TEMPLATES.general;
}

/**
 * Return array of all template definitions for superadmin selection
 */
export function getAllTemplates() {
  return Object.values(BUSINESS_TEMPLATES);
}

/**
 * Return extra fields array for a business type
 */
export function getTemplateCustomFields(businessType) {
  const tpl = getTemplate(businessType);
  return tpl.extraProductFields || [];
}

/**
 * Return allowed units for a business type
 */
export function getTemplateUnits(businessType) {
  const tpl = getTemplate(businessType);
  return tpl.units || [];
}

/**
 * Return expense categories for a business type
 */
export function getTemplateExpenseCategories(businessType) {
  const tpl = getTemplate(businessType);
  return tpl.expenseCategories || [];
}

/**
 * Get overridden UI label if defined in template, else fallback
 */
export function getTemplateLabel(businessType, labelKey, lang = 'bn', fallback = '') {
  const tpl = getTemplate(businessType);
  if (tpl.labels && tpl.labels[labelKey]) {
    return tpl.labels[labelKey][lang] || tpl.labels[labelKey].bn || fallback;
  }
  return fallback;
}
