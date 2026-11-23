import dotenv from 'dotenv';
dotenv.config();

import connectDB from './lib/db.js';
import { Business, User, Party, Product, Sale, Purchase, Payment, Expense } from './models/index.js';
import { hashPassword } from './lib/auth.js';

async function seedDatabase() {
  console.log('🌱 Starting Hisaaboo multi-tenant seed process for all trade verticals...');
  await connectDB();

  const ownerPassword = await hashPassword('owner123');
  const superadminPassword = await hashPassword('admin123');
  const oneYearFromNow = new Date();
  oneYearFromNow.setDate(oneYearFromNow.getDate() + 365);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 1. Superadmin
  console.log('Creating Superadmin account...');
  let superadmin = await User.findOne({ role: 'superadmin' });
  if (!superadmin) {
    superadmin = await User.create({
      name: 'Hisaaboo Superadmin',
      phone: '01800000000',
      email: 'admin@hisaaboo.com',
      password: superadminPassword,
      role: 'superadmin',
      businessId: null,
      isActive: true,
    });
    console.log('✓ Superadmin created (Phone: 01800000000 / Password: admin123)');
  }

  // Helper to upsert a business and owner
  async function setupBusinessAndOwner(bizData, ownerData) {
    let biz = await Business.findOne({ phone: bizData.phone });
    if (!biz) {
      biz = await Business.create({
        ...bizData,
        yearlyFee: bizData.yearlyFee || 12000,
        paidUntil: oneYearFromNow,
        paymentStatus: 'active',
        paymentHistory: [
          {
            amount: bizData.yearlyFee || 12000,
            date: new Date(),
            method: 'bank',
            notes: 'Annual license fee paid',
          },
        ],
      });
      console.log(`✓ Business created: ${biz.name} (${biz.businessType})`);
    }

    let owner = await User.findOne({ phone: ownerData.phone });
    if (!owner) {
      owner = await User.create({
        ...ownerData,
        password: ownerPassword,
        role: 'owner',
        businessId: biz._id,
        isActive: true,
      });
      console.log(`✓ Owner created: ${owner.name} (${owner.phone})`);
    } else {
      owner.businessId = biz._id;
      await owner.save();
    }

    // Clear tenant old records for clean demo
    await Promise.all([
      Party.deleteMany({ businessId: biz._id }),
      Product.deleteMany({ businessId: biz._id }),
      Sale.deleteMany({ businessId: biz._id }),
      Purchase.deleteMany({ businessId: biz._id }),
      Payment.deleteMany({ businessId: biz._id }),
      Expense.deleteMany({ businessId: biz._id }),
    ]);

    return { biz, owner };
  }

  // ==========================================
  // 1. YARN TRADING (সুতা ব্যবসা - টানবাজার)
  // ==========================================
  console.log('\n--- Seeding 1. Yarn Trading (টানবাজার, নারায়ণগঞ্জ) ---');
  const { biz: yarnBiz, owner: yarnOwner } = await setupBusinessAndOwner(
    {
      name: 'আল-মদিনা সুতা ট্রেডার্স',
      ownerName: 'হাজী মোহাম্মদ রফিক',
      phone: '01711111111',
      address: 'টানবাজার, নারায়ণগঞ্জ',
      businessType: 'yarn',
      yearlyFee: 12000,
      invoiceFooterNote: 'সুতা ক্রয়ের জন্য ধন্যবাদ। টানবাজার, নারায়ণগঞ্জ।',
    },
    { name: 'হাজী মোহাম্মদ রফিক', phone: '01711111111' }
  );

  const [yCust1, yCust2, yMill1] = await Promise.all([
    Party.create({
      businessId: yarnBiz._id,
      name: 'মেসার্স রহিম টেক্সটাইল মিলস',
      type: 'customer',
      phone: '01712345678',
      address: 'ফতুল্লা, নারায়ণগঞ্জ',
      openingBalance: 45000,
    }),
    Party.create({
      businessId: yarnBiz._id,
      name: 'আল-আমিন হোসিয়ারি অ্যান্ড উইভিং',
      type: 'customer',
      phone: '01823456789',
      address: 'মাধবদী বাজার, নরসিংদী',
      openingBalance: 25000,
    }),
    Party.create({
      businessId: yarnBiz._id,
      name: 'স্কয়ার টেক্সটাইলস লিমিটেড',
      type: 'supplier',
      phone: '01799887766',
      address: 'ভালুকা, ময়মনসিংহ',
      openingBalance: 0,
    }),
  ]);

  const [yProd1, yProd2, yProd3] = await Promise.all([
    Product.create({
      businessId: yarnBiz._id,
      name: '30/1 - Combed - Square Textiles',
      unit: 'bag',
      purchasePrice: 42000,
      salePrice: 45000,
      stock: 120,
      lowStockLevel: 20,
      customFields: { count: '30/1', yarnType: 'Combed', brand: 'Square Textiles', lot: 'SQ-901', conesPerBag: '24', lbsPerBag: '100', color: 'Raw White' },
    }),
    Product.create({
      businessId: yarnBiz._id,
      name: '20/1 - Carded - Badsha Textiles',
      unit: 'bag',
      purchasePrice: 38000,
      salePrice: 41000,
      stock: 65,
      lowStockLevel: 15,
      customFields: { count: '20/1', yarnType: 'Carded', brand: 'Badsha Textiles', lot: 'BD-105', conesPerBag: '24', lbsPerBag: '100', color: 'Raw White' },
    }),
    Product.create({
      businessId: yarnBiz._id,
      name: '40/1 - Slub - Envoy Textiles',
      unit: 'bag',
      purchasePrice: 51000,
      salePrice: 55000,
      stock: 8,
      lowStockLevel: 15,
      customFields: { count: '40/1', yarnType: 'Slub', brand: 'Envoy Textiles', lot: 'EV-202', conesPerBag: '24', lbsPerBag: '100', color: 'Raw White' },
    }),
  ]);

  await Sale.create({
    businessId: yarnBiz._id,
    invoiceNo: 'YRN-1001',
    partyId: yCust1._id,
    date: today,
    items: [{ productId: yProd1._id, productName: yProd1.name, unit: 'bag', quantity: 10, rate: 45000, total: 450000, customFields: yProd1.customFields }],
    subTotal: 450000,
    discount: 5000,
    totalAmount: 445000,
    paidAmount: 250000,
    dueAmount: 195000,
    paymentMethod: 'bank',
    createdBy: yarnOwner._id,
  });

  await Expense.create({
    businessId: yarnBiz._id,
    category: 'labour',
    amount: 4500,
    paymentMethod: 'cash',
    date: today,
    note: 'গোডাউন লোডিং কুলি খরচ',
    createdBy: yarnOwner._id,
  });

  // ==========================================
  // 2. GROCERY & FOOD WHOLESALE (মুদি ও খাদ্যপণ্য - মৌলভীবাজার)
  // ==========================================
  console.log('\n--- Seeding 2. Grocery & Wholesale (মৌলভীবাজার, ঢাকা) ---');
  const { biz: grocBiz, owner: grocOwner } = await setupBusinessAndOwner(
    {
      name: 'বিসমিল্লাহ্ সুপার গ্রোসারি ও খাদ্যপণ্য',
      ownerName: 'হাজী কামাল উদ্দিন',
      phone: '01922222222',
      address: 'মৌলভীবাজার পাইকারি মার্কেট, ঢাকা',
      businessType: 'grocery',
      yearlyFee: 10000,
      invoiceFooterNote: 'ন্যায্য মূল্যে খাঁটি খাদ্যপণ্য। আমাদের সেবা গ্রহণের জন্য ধন্যবাদ।',
    },
    { name: 'হাজী কামাল উদ্দিন', phone: '01922222222' }
  );

  const [gCust1, gSupp1] = await Promise.all([
    Party.create({
      businessId: grocBiz._id,
      name: 'মায়ের দোয়া কনফেকশনারি অ্যান্ড স্টোর',
      type: 'customer',
      phone: '01911223344',
      address: 'লালবাগ, ঢাকা',
      openingBalance: 12000,
    }),
    Party.create({
      businessId: grocBiz._id,
      name: 'সিটি গ্রুপ অব ইন্ডাস্ট্রিজ (তীর ডিপো)',
      type: 'supplier',
      phone: '01955667788',
      address: 'মতিঝিল, ঢাকা',
      openingBalance: 0,
    }),
  ]);

  const [gProd1, gProd2, gProd3] = await Promise.all([
    Product.create({
      businessId: grocBiz._id,
      name: 'তীর সয়াবিন তেল (৫ লিটার জার)',
      unit: 'carton',
      purchasePrice: 3800,
      salePrice: 4100,
      stock: 45, // 45 cartons (4 jars per carton)
      lowStockLevel: 10,
      customFields: { brand: 'তীর (Teer)', packSize: '5 Liter Jar', category: 'ভোজ্যতেল (Edible Oil)' },
    }),
    Product.create({
      businessId: grocBiz._id,
      name: 'মিনিকেট প্রিমিয়াম চাল (৫০ কেজি বস্তা)',
      unit: 'sack',
      purchasePrice: 3400,
      salePrice: 3650,
      stock: 80,
      lowStockLevel: 15,
      customFields: { brand: 'রশিদ অটো রাইস', packSize: '50 Kg Sack', category: 'চাল (Rice)' },
    }),
    Product.create({
      businessId: grocBiz._id,
      name: 'রূপচাঁদা সরিষার তেল (১ লিটার বোতল)',
      unit: 'carton',
      purchasePrice: 3100,
      salePrice: 3350,
      stock: 3, // Low stock!
      lowStockLevel: 8,
      customFields: { brand: 'রূপচাঁদা (Rupchanda)', packSize: '1 Liter', category: 'ভোজ্যতেল (Edible Oil)' },
    }),
  ]);

  await Sale.create({
    businessId: grocBiz._id,
    invoiceNo: 'GROC-2001',
    partyId: gCust1._id,
    date: today,
    items: [
      { productId: gProd1._id, productName: gProd1.name, unit: 'carton', quantity: 5, rate: 4100, total: 20500 },
      { productId: gProd2._id, productName: gProd2.name, unit: 'sack', quantity: 10, rate: 3650, total: 36500 },
    ],
    subTotal: 57000,
    discount: 500,
    totalAmount: 56500,
    paidAmount: 40000,
    dueAmount: 16500,
    paymentMethod: 'cash',
    createdBy: grocOwner._id,
  });

  // ==========================================
  // 3. ELECTRONICS & MOBILE GADGETS (ইলেকট্রনিক্স ও মোবাইল)
  // ==========================================
  console.log('\n--- Seeding 3. Electronics & Gadgets (স্টেডিয়াম মার্কেট, ঢাকা) ---');
  const { biz: elecBiz, owner: elecOwner } = await setupBusinessAndOwner(
    {
      name: 'ঢাকা গ্যাজেট ও ইলেকট্রনিক্স শোরুম',
      ownerName: 'তানভীর আহমেদ',
      phone: '01733333333',
      address: 'বঙ্গবন্ধু জাতীয় স্টেডিয়াম মার্কেট, ঢাকা',
      businessType: 'electronics',
      yearlyFee: 12000,
      invoiceFooterNote: 'অফিসিয়াল ওয়ারেন্টি পণ্য ক্রয়ের জন্য ধন্যবাদ। বিলটি সংরক্ষণ করুন।',
    },
    { name: 'তানভীর আহমেদ', phone: '01733333333' }
  );

  const [eCust1, eSupp1] = await Promise.all([
    Party.create({
      businessId: elecBiz._id,
      name: 'ইঞ্জিনিয়ার আসাদুল হক',
      type: 'customer',
      phone: '01788776655',
      address: 'ধানমন্ডি, ঢাকা',
      openingBalance: 0,
    }),
    Party.create({
      businessId: elecBiz._id,
      name: 'স্যামসাং বাংলাদেশ অফিসিয়াল ডিলার',
      type: 'supplier',
      phone: '01700998811',
      address: 'গুলশান ১, ঢাকা',
      openingBalance: 0,
    }),
  ]);

  const [eProd1, eProd2, eProd3] = await Promise.all([
    Product.create({
      businessId: elecBiz._id,
      name: 'Samsung Galaxy A55 5G - Awesome Navy',
      unit: 'pcs',
      purchasePrice: 42000,
      salePrice: 47500,
      stock: 12,
      lowStockLevel: 3,
      customFields: { brand: 'Samsung', model: 'Galaxy A55 5G', serialOrImei: '869012345678901', warranty: '১ বছর অফিসিয়াল ওয়্যারেন্টি', color: 'Navy / 8GB-256GB' },
    }),
    Product.create({
      businessId: elecBiz._id,
      name: 'Xiaomi Redmi Note 13 Pro 4G',
      unit: 'pcs',
      purchasePrice: 28000,
      salePrice: 31500,
      stock: 18,
      lowStockLevel: 5,
      customFields: { brand: 'Xiaomi / Redmi', model: 'Redmi Note 13 Pro', serialOrImei: '864455667788990', warranty: '১ বছর অফিসিয়াল ওয়্যারেন্টি', color: 'Midnight Black / 8GB' },
    }),
    Product.create({
      businessId: elecBiz._id,
      name: 'Walton 43" 4K Smart Android TV',
      unit: 'pcs',
      purchasePrice: 32000,
      salePrice: 36900,
      stock: 2, // Low stock alert!
      lowStockLevel: 4,
      customFields: { brand: 'Walton', model: 'W43E800', serialOrImei: 'WAL-TV-9021', warranty: '২ বছর প্যানেল ওয়্যারেন্টি', color: 'Black Frameless' },
    }),
  ]);

  await Sale.create({
    businessId: elecBiz._id,
    invoiceNo: 'ELEC-3001',
    partyId: eCust1._id,
    date: today,
    items: [{ productId: eProd1._id, productName: eProd1.name, unit: 'pcs', quantity: 1, rate: 47500, total: 47500, customFields: eProd1.customFields }],
    subTotal: 47500,
    discount: 1000,
    totalAmount: 46500,
    paidAmount: 46500,
    dueAmount: 0,
    paymentMethod: 'bKash',
    notes: 'IMEI: 869012345678901 সহ অফিসিয়াল ক্যাশ মেমো',
    createdBy: elecOwner._id,
  });

  // ==========================================
  // 4. PHARMACY & MEDICINE (ফার্মেসি ও ঔষধ)
  // ==========================================
  console.log('\n--- Seeding 4. Pharmacy & Medicine (মিটফোর্ড, ঢাকা) ---');
  const { biz: pharmBiz, owner: pharmOwner } = await setupBusinessAndOwner(
    {
      name: 'জনসেবা ফার্মেসি ও মেডিসিন কর্নার',
      ownerName: 'ডাঃ মোস্তাফিজুর রহমান',
      phone: '01744444444',
      address: 'মিটফোর্ড রোড, বাবুবাজার, ঢাকা',
      businessType: 'pharmacy',
      yearlyFee: 10000,
      invoiceFooterNote: 'প্রেসক্রিপশন অনুযায়ী সঠিক ওষুধ সেবন করুন। সুস্থ থাকুন।',
    },
    { name: 'ডাঃ মোস্তাফিজুর রহমান', phone: '01744444444' }
  );

  const [phCust1, phSupp1] = await Promise.all([
    Party.create({
      businessId: pharmBiz._id,
      name: 'সেন্ট্রাল কেয়ার ক্লিনিক অ্যান্ড ডায়াগনস্টিক',
      type: 'customer',
      phone: '01719922883',
      address: 'চকবাজার, ঢাকা',
      openingBalance: 18500,
    }),
    Party.create({
      businessId: pharmBiz._id,
      name: 'স্কয়ার ফার্মাসিউটিক্যালস সেলস ডিপো',
      type: 'supplier',
      phone: '01711003322',
      address: 'তেজগাঁও শিল্প এলাকা, ঢাকা',
      openingBalance: 0,
    }),
  ]);

  const [phProd1, phProd2, phProd3] = await Promise.all([
    Product.create({
      businessId: pharmBiz._id,
      name: 'Napa Extra (500mg+65mg) - Square',
      unit: 'strip',
      purchasePrice: 28,
      salePrice: 35,
      stock: 250, // 250 strips
      lowStockLevel: 40,
      customFields: { genericName: 'Paracetamol + Caffeine', company: 'Square Pharmaceuticals', strength: '500 mg', batchNo: 'SQ-NP-88', expiryDate: '10/2027' },
    }),
    Product.create({
      businessId: pharmBiz._id,
      name: 'Seclo 20mg Capsule - Square',
      unit: 'box',
      purchasePrice: 560,
      salePrice: 650,
      stock: 35, // 35 boxes
      lowStockLevel: 10,
      customFields: { genericName: 'Omeprazole', company: 'Square Pharmaceuticals', strength: '20 mg', batchNo: 'SEC-402', expiryDate: '12/2026' },
    }),
    Product.create({
      businessId: pharmBiz._id,
      name: 'Cef-3 200mg Capsule - Square',
      unit: 'box',
      purchasePrice: 950,
      salePrice: 1100,
      stock: 2, // Low stock alert!
      lowStockLevel: 5,
      customFields: { genericName: 'Cefixime', company: 'Square Pharmaceuticals', strength: '200 mg', batchNo: 'CEF-909', expiryDate: '06/2026' },
    }),
  ]);

  await Sale.create({
    businessId: pharmBiz._id,
    invoiceNo: 'RX-4001',
    partyId: phCust1._id,
    date: today,
    items: [
      { productId: phProd1._id, productName: phProd1.name, unit: 'strip', quantity: 20, rate: 35, total: 700 },
      { productId: phProd2._id, productName: phProd2.name, unit: 'box', quantity: 5, rate: 650, total: 3250 },
    ],
    subTotal: 3950,
    discount: 150,
    totalAmount: 3800,
    paidAmount: 3800,
    dueAmount: 0,
    paymentMethod: 'cash',
    notes: 'ক্লিনিক ওটি সাপ্লাই মেমো',
    createdBy: pharmOwner._id,
  });

  // ==========================================
  // 5. ROD, CEMENT & HARDWARE (রড, সিমেন্ট ও নির্মাণ সামগ্রী)
  // ==========================================
  console.log('\n--- Seeding 5. Hardware & Rod-Cement (চাষাঢ়া, নারায়ণগঞ্জ) ---');
  const { biz: hardBiz, owner: hardOwner } = await setupBusinessAndOwner(
    {
      name: 'মেসার্স হক ব্রাদার্স রড ও সিমেন্ট',
      ownerName: 'হাজী এনামুল হক',
      phone: '01755555555',
      address: 'চাষাঢ়া মোড়, নারায়ণগঞ্জ',
      businessType: 'hardware',
      yearlyFee: 12000,
      invoiceFooterNote: 'গুণগত মানের রড ও সিমেন্ট সরবরাহকারী। ট্রাক ডেলিভারি নিশ্চিত।',
    },
    { name: 'হাজী এনামুল হক', phone: '01755555555' }
  );

  const [hCust1, hSupp1] = await Promise.all([
    Party.create({
      businessId: hardBiz._id,
      name: 'রাজ বিল্ডার্স অ্যান্ড ডেভেলপার্স লি:',
      type: 'customer',
      phone: '01715566778',
      address: 'জালকুড়ি, নারায়ণগঞ্জ',
      openingBalance: 120000,
    }),
    Party.create({
      businessId: hardBiz._id,
      name: 'BSRM স্টিল মিলস লিমিটেড',
      type: 'supplier',
      phone: '01711224466',
      address: 'চট্টগ্রাম / ঢাকা অফিস',
      openingBalance: 0,
    }),
  ]);

  const [hProd1, hProd2, hProd3] = await Promise.all([
    Product.create({
      businessId: hardBiz._id,
      name: 'BSRM Xtreme 500W - 12mm MS Rod',
      unit: 'ton',
      purchasePrice: 94000,
      salePrice: 98500,
      stock: 45, // 45 tons
      lowStockLevel: 10,
      customFields: { brand: 'BSRM Steels', gradeOrSize: '12 mm (500W)', category: 'এমএস রড (MS Rod)' },
    }),
    Product.create({
      businessId: hardBiz._id,
      name: 'BSRM Xtreme 500W - 16mm MS Rod',
      unit: 'ton',
      purchasePrice: 94500,
      salePrice: 99000,
      stock: 30, // 30 tons
      lowStockLevel: 8,
      customFields: { brand: 'BSRM Steels', gradeOrSize: '16 mm (500W)', category: 'এমএস রড (MS Rod)' },
    }),
    Product.create({
      businessId: hardBiz._id,
      name: 'শাহ সিমেন্ট স্পেশাল (OPC - ৫০ কেজি ব্যাগ)',
      unit: 'bag',
      purchasePrice: 520,
      salePrice: 560,
      stock: 400, // 400 bags
      lowStockLevel: 50,
      customFields: { brand: 'Shah Cement', gradeOrSize: 'OPC Cement', category: 'সিমেন্ট (Cement)' },
    }),
  ]);

  await Sale.create({
    businessId: hardBiz._id,
    invoiceNo: 'ROD-5001',
    partyId: hCust1._id,
    date: today,
    items: [
      { productId: hProd1._id, productName: hProd1.name, unit: 'ton', quantity: 5, rate: 98500, total: 492500 },
      { productId: hProd3._id, productName: hProd3.name, unit: 'bag', quantity: 100, rate: 560, total: 56000 },
    ],
    subTotal: 548500,
    discount: 3500,
    totalAmount: 545000,
    paidAmount: 300000,
    dueAmount: 245000,
    paymentMethod: 'bank',
    notes: 'প্রজেক্ট সাইট ডেলিভারি চালান নং TR-902',
    createdBy: hardOwner._id,
  });

  // ==========================================
  // 6. CLOTHING & FABRICS (পোশাক ও থান কাপড়)
  // ==========================================
  console.log('\n--- Seeding 6. Clothing & Fabrics (ইসলামপুর, ঢাকা) ---');
  const { biz: clothBiz, owner: clothOwner } = await setupBusinessAndOwner(
    {
      name: 'আমানত ফেব্রিক্স ও ফ্যাশন হাউস',
      ownerName: 'মোঃ সিরাজুল ইসলাম',
      phone: '01766666666',
      address: 'ইসলামপুর কাপড়ের মার্কেট, ঢাকা',
      businessType: 'clothing',
      yearlyFee: 10000,
      invoiceFooterNote: 'দেশি ও বিদেশি আকর্ষণীয় থান কাপড় ও বুটিক সামগ্রী। ধন্যবাদ।',
    },
    { name: 'মোঃ সিরাজুল ইসলাম', phone: '01766666666' }
  );

  const [cCust1, cSupp1] = await Promise.all([
    Party.create({
      businessId: clothBiz._id,
      name: 'রুচি বুটিক অ্যান্ড ফ্যাশন স্টুডিও',
      type: 'customer',
      phone: '01718899001',
      address: 'মিরপুর ১০, ঢাকা',
      openingBalance: 32000,
    }),
    Party.create({
      businessId: clothBiz._id,
      name: 'বাবুরহাট পাইকারি তাঁত সমবায়',
      type: 'supplier',
      phone: '01722334455',
      address: 'বাবুরহাট, নরসিংদী',
      openingBalance: 0,
    }),
  ]);

  const [cProd1, cProd2] = await Promise.all([
    Product.create({
      businessId: clothBiz._id,
      name: 'খাঁটি দেশি সুতি থান কাপড় (১০০% কটন)',
      unit: 'goj',
      purchasePrice: 95,
      salePrice: 130,
      stock: 800, // 800 goj
      lowStockLevel: 100,
      customFields: { fabricType: 'কটন (Cotton)', color: 'White / Dyed', brand: 'বাবুরহাট তাঁত' },
    }),
    Product.create({
      businessId: clothBiz._id,
      name: 'ডিজিটাল প্রিন্ট লিলেন বুটিক থ্রি-পিস',
      unit: 'set',
      purchasePrice: 1200,
      salePrice: 1650,
      stock: 120, // 120 sets
      lowStockLevel: 25,
      customFields: { fabricType: 'লিলেন (Linen)', size: 'Free Size', color: 'Multicolor Print', brand: 'আমানত বুটিক' },
    }),
  ]);

  await Sale.create({
    businessId: clothBiz._id,
    invoiceNo: 'FASH-6001',
    partyId: cCust1._id,
    date: today,
    items: [
      { productId: cProd1._id, productName: cProd1.name, unit: 'goj', quantity: 100, rate: 130, total: 13000 },
      { productId: cProd2._id, productName: cProd2.name, unit: 'set', quantity: 15, rate: 1650, total: 24750 },
    ],
    subTotal: 37750,
    discount: 750,
    totalAmount: 37000,
    paidAmount: 20000,
    dueAmount: 17000,
    paymentMethod: 'cash',
    createdBy: clothOwner._id,
  });

  console.log('\n========================================================================');
  console.log('🎉 MULTI-TENANT SEEDING COMPLETED FOR ALL BANGLADESHI BUSINESS VERTICALS!');
  console.log('------------------------------------------------------------------------');
  console.log('1. Superadmin (অ্যাডমিন হাব):      01800000000 | admin123');
  console.log('2. Yarn Trading (সুতা ব্যবসা):    01711111111 | owner123 (আল-মদিনা सुता)');
  console.log('3. Grocery (মুদি ও খাদ্যপণ্য):    01922222222 | owner123 (বিসমিল্লাহ্ গ্রোসারি)');
  console.log('4. Electronics (ইলেকট্রনিক্স):     01733333333 | owner123 (ঢাকা গ্যাজেট)');
  console.log('5. Pharmacy (ফার্মেসি ও ঔষধ):      01744444444 | owner123 (জনসেবা ফার্মেসি)');
  console.log('6. Hardware (রড ও সিমেন্ট):       01755555555 | owner123 (হক ব্রাদার্স)');
  console.log('7. Clothing (পোশাক ও ফেব্রিক্স):   01766666666 | owner123 (আমানত ফেব্রিক্স)');
  console.log('========================================================================\n');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
